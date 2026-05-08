import re
import io
import logging
import httpx
from typing import Optional, List, Dict, Any

from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    InputFile,
)
from telegram.ext import (
    ContextTypes,
)
from telegram.error import TelegramError

from config import Settings
from api_client import APIClient


logger = logging.getLogger(__name__)


async def get_main_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📁 My Files", callback_data="menu_files")],
        [InlineKeyboardButton("📤 Upload", callback_data="menu_upload")],
        [InlineKeyboardButton("🔍 Search", callback_data="menu_search")],
        [InlineKeyboardButton("📊 Statistics", callback_data="menu_stats")],
        [InlineKeyboardButton("⚙️ Status", callback_data="menu_status")],
    ])


async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    await update.message.reply_text(
        f"🌟 *Welcome to Orion NAS!*",
        parse_mode="Markdown",
        reply_markup=await get_main_menu_keyboard()
    )


async def handle_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    help_text = """
📖 *Orion NAS — Help*

*File Commands:*
/upload - Upload a file
/list - List your files
/get [file_id] - Download a file
/delete [file_id] - Delete a file
/search [query] - Search files
/url [url] - Download from URL

*Folder Commands:*
/mkdir [name] - Create folder
/ls - Browse current folder
/cd [folder] - Go into folder
/cd .. - Go back
/cd / - Go to root
/rmdir [name] - Delete empty folder

*Storage:*
/move [file_id] [folder] - Move file
/copy [file_id] [folder] - Copy file
/quota - Storage usage
/stats - Full stats
/status - System status

*Quick Tips:*
• Send any file directly to upload it
• /ls shows your folder + quota
• Use /cd .. to navigate back
    """
    await update.message.reply_text(
        help_text,
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("<< Back to Menu", callback_data="main_menu")]
        ])
    )


async def handle_upload(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Auto-upload: fires for any media sent directly (photo/video/audio/document/etc)."""
    message = update.message
    user = update.effective_user

    settings = Settings()
    api_client = APIClient(settings)

    # Resolve the Telegram file object + a human-readable name
    file_obj = None
    file_name = None

    if message.document:
        file_obj = await message.document.get_file()
        file_name = message.document.file_name or f"doc_{file_obj.file_id}"
    elif message.photo:
        file_obj = await message.photo[-1].get_file()
        file_name = f"photo_{file_obj.file_id}.jpg"
    elif message.video:
        file_obj = await message.video.get_file()
        file_name = message.video.file_name or f"video_{file_obj.file_id}.mp4"
    elif message.audio:
        file_obj = await message.audio.get_file()
        file_name = message.audio.file_name or f"audio_{file_obj.file_id}.mp3"
    elif message.voice:
        file_obj = await message.voice.get_file()
        file_name = f"voice_{file_obj.file_id}.ogg"
    elif message.video_note:
        file_obj = await message.video_note.get_file()
        file_name = f"video_note_{file_obj.file_id}.mp4"
    else:
        return  # nothing to upload

    uploading_msg = await message.reply_text("📤 *Uploading…*", parse_mode="Markdown")
    try:
        file_bytes = await file_to_download_as_bytes(file_obj)
        content_type = _get_content_type(file_name)

        result = await api_client.upload_file(
            telegram_id=user.id,
            file_name=file_name,
            file_content=file_bytes,
            content_type=content_type,
            tags=None,
        )

        if result.get("success"):
            folder = result.get("folder_path", "")
            loc = f"/{folder}/{file_name}" if folder else f"/{file_name}"
            await uploading_msg.edit_text(
                f"✅ *Uploaded!*\n\n"
                f"📄 `{result.get('file_id')}`\n"
                f"📁 {file_name}\n"
                f"💾 {result.get('size_formatted')}\n"
                f"📍 {loc}",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("📁 My Files", callback_data="menu_files")],
                    [InlineKeyboardButton("<< Back", callback_data="main_menu")],
                ]),
            )
        else:
            await uploading_msg.edit_text(
                f"❌ Upload failed: {result.get('error', 'Unknown error')}",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("<< Back", callback_data="main_menu")],
                ]),
            )
    except Exception as e:
        logger.error(f"Upload error: {e}")
        await uploading_msg.edit_text(f"❌ Error: {str(e)}")


async def handle_url_download(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Auto-download files from URLs sent in chat."""
    message = update.message
    user = update.effective_user
    settings = Settings()
    api_client = APIClient(settings)

    text = (message.text or message.caption or "").strip()
    if not text:
        return

    url_pattern = re.compile(
        r"https?://[^\s<>\"']+(?:\.[^\s<>\"']+)*", re.IGNORECASE
    )
    urls = url_pattern.findall(text)

    if not urls:
        return

    for url in urls:
        status_msg = await message.reply_text(
            f"⏳ *Downloading from URL...*\n`{url[:60]}...`",
            parse_mode="Markdown"
        )

        try:
            async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
                response = await client.get(url)
                response.raise_for_status()
                file_content = response.content

            parsed_url = httpx.URL(url)
            file_name = parsed_url.params.get("filename", "")
            if not file_name:
                cd = response.headers.get("content-disposition", "")
                match = re.search(r'filename[^;=\n]*=(?:\\?["\'])?([^;\n]*)', cd)
                if match:
                    file_name = match.group(1).strip('"\' ')
                else:
                    file_name = parsed_url.path.split("/")[-1] or "download"

            content_type = response.headers.get("content-type", "application/octet-stream")
            content_type = content_type.split(";")[0].strip()

            if "." not in file_name and content_type:
                ext_map = {
                    "image/jpeg": ".jpg", "image/png": ".png",
                    "image/gif": ".gif", "image/webp": ".webp",
                    "application/pdf": ".pdf", "text/plain": ".txt",
                    "video/mp4": ".mp4", "audio/mpeg": ".mp3",
                }
                file_name += ext_map.get(content_type, "")

            result = await api_client.upload_file(
                telegram_id=user.id,
                file_name=file_name,
                file_content=file_content,
                content_type=content_type,
                tags=["auto-download", "url"]
            )

            if result.get("success"):
                await status_msg.edit_text(
                    f"✅ *Downloaded & saved!*\n\n"
                    f"📄 `{result.get('file_id')}`\n"
                    f"📁 {file_name}\n"
                    f"💾 {result.get('size_formatted')}",
                    parse_mode="Markdown"
                )
            else:
                await status_msg.edit_text(
                    f"❌ Upload failed: {result.get('error', 'Unknown error')}"
                )

        except httpx.TimeoutException:
            await status_msg.edit_text(f"❌ Timeout downloading: `{url[:60]}`")
        except httpx.HTTPStatusError as e:
            await status_msg.edit_text(
                f"❌ HTTP error {e.response.status_code} downloading: `{url[:60]}`"
            )
        except Exception as e:
            await status_msg.edit_text(f"❌ Error: {str(e)}")


async def handle_list(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    settings = Settings()
    api_client = APIClient(settings)

    loading_msg = await update.message.reply_text("📋 *Loading your files...*", parse_mode="Markdown")

    try:
        result = await api_client.list_files(telegram_id=user.id, page=1, limit=10)

        if not result.get("files"):
            await loading_msg.edit_text(
                "📭 *No files found.*\n\nUpload your first file!",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("📤 Upload", callback_data="menu_upload")],
                    [InlineKeyboardButton("<< Back", callback_data="main_menu")]
                ])
            )
            return

        files_text = "📁 *Your Files:*\n\n"
        keyboard_buttons = []

        for idx, file_info in enumerate(result.get("files", [])):
            file_name = file_info.get("file_name", "Unknown")
            file_id = file_info.get("file_id", "")
            size = file_info.get("size_formatted", "0 B")
            created = file_info.get("created_at", "")
            
            files_text += f"{idx + 1}. 📄 `{file_id}`\n  {file_name}\n  💾 {size} • {created}\n\n"
            
            keyboard_buttons.append([
                InlineKeyboardButton(f"📥 Get #{idx + 1}", callback_data=f"get_{file_id}"),
                InlineKeyboardButton(f"🗑️ #{idx + 1}", callback_data=f"del_{file_id}")
            ])

        keyboard_buttons.append([InlineKeyboardButton("<< Back", callback_data="main_menu")])

        await loading_msg.edit_text(
            files_text,
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard_buttons)
        )

    except Exception as e:
        logger.error(f"List files error: {e}")
        await loading_msg.edit_text(f"❌ Error: {str(e)}")


async def handle_get(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    settings = Settings()
    api_client = APIClient(settings)

    if not context.args:
        await update.message.reply_text(
            "Usage: /get [file_id]\n\nUse /list to see your files.",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("📁 My Files", callback_data="menu_files")],
                [InlineKeyboardButton("<< Back", callback_data="main_menu")]
            ])
        )
        return

    file_id = context.args[0]
    downloading_msg = await update.message.reply_text("📥 *Downloading file...*", parse_mode="Markdown")

    try:
        file_data = await api_client.get_file(file_id=file_id, telegram_id=user.id)
        
        if not file_data.get("success"):
            await downloading_msg.edit_text(
                f"❌ File not found or access denied.",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("<< Back", callback_data="main_menu")]
                ])
            )
            return

        file_content = await api_client.download_file(file_id=file_id, telegram_id=user.id)
        file_name = file_data.get("file_name", f"file_{file_id}")

        await downloading_msg.edit_text(
            f"✅ *Sending file: {file_name}*",
            parse_mode="Markdown"
        )

        await update.message.reply_document(
            document=InputFile(file_content, filename=file_name),
            caption=f"📄 {file_name}\n💾 {file_data.get('size_formatted', 'Unknown size')}"
        )

    except Exception as e:
        logger.error(f"Download error: {e}")
        await downloading_msg.edit_text(f"❌ Error: {str(e)}")


async def handle_delete(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    settings = Settings()
    api_client = APIClient(settings)

    if not context.args:
        await update.message.reply_text(
            "Usage: /delete [file_id]",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("📁 My Files", callback_data="menu_files")]
            ])
        )
        return

    file_id = context.args[0]
    confirm_msg = await update.message.reply_text(
        f"⚠️ *Delete file {file_id}?*\n\nThis action cannot be undone.",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup([
            [
                InlineKeyboardButton("✅ Yes, Delete", callback_data=f"confirm_del_{file_id}"),
                InlineKeyboardButton("❌ Cancel", callback_data="main_menu")
            ]
        ])
    )


async def handle_search(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    settings = Settings()
    api_client = APIClient(settings)

    if not context.args:
        await update.message.reply_text(
            "Usage: /search [query]\n\nExample: /search report",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("<< Back", callback_data="main_menu")]
            ])
        )
        return

    query = " ".join(context.args)
    searching_msg = await update.message.reply_text(f"🔍 *Searching for: {query}*", parse_mode="Markdown")

    try:
        result = await api_client.search_files(telegram_id=user.id, query=query)

        if not result.get("files"):
            await searching_msg.edit_text(
                f"🔍 *No results for: {query}*",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("<< Back", callback_data="main_menu")]
                ])
            )
            return

        files_text = f"🔍 *Search Results for: {query}*\n\n"
        keyboard_buttons = []

        for idx, file_info in enumerate(result.get("files", [])[:10]):
            file_name = file_info.get("file_name", "Unknown")
            file_id = file_info.get("file_id", "")
            files_text += f"{idx + 1}. 📄 `{file_id}`\n  {file_name}\n\n"
            keyboard_buttons.append([
                InlineKeyboardButton(f"📥 Get", callback_data=f"get_{file_id}")
            ])

        keyboard_buttons.append([InlineKeyboardButton("<< Back", callback_data="main_menu")])

        await searching_msg.edit_text(
            files_text,
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard_buttons)
        )

    except Exception as e:
        logger.error(f"Search error: {e}")
        await searching_msg.edit_text(f"❌ Error: {str(e)}")


async def handle_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    settings = Settings()
    api_client = APIClient(settings)

    status_msg = await update.message.reply_text("⚙️ *Checking system status...*", parse_mode="Markdown")

    try:
        status = await api_client.get_system_status()
        queue_status = await api_client.get_queue_status()

        status_text = (
            f"⚙️ *Orion NAS System Status*\n\n"
            f"*Uptime:* {status.get('uptime', 'N/A')}\n"
            f"*Processing Queue:*\n"
            f"• Pending: {queue_status.get('pending', 0)}\n"
            f"• Processing: {queue_status.get('processing', 0)}\n"
            f"• Completed: {queue_status.get('completed', 0)}"
        )

        await status_msg.edit_text(
            status_text,
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🔄 Refresh", callback_data="menu_status")],
                [InlineKeyboardButton("<< Back", callback_data="main_menu")]
            ])
        )

    except Exception as e:
        logger.error(f"Status error: {e}")
        await status_msg.edit_text(f"❌ Error: {str(e)}")


async def handle_stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    settings = Settings()
    api_client = APIClient(settings)

    stats_msg = await update.message.reply_text("📊 *Loading statistics...*", parse_mode="Markdown")

    try:
        stats = await api_client.get_stats(telegram_id=user.id)
        storage = stats.get("storage", {})
        files = stats.get("files", {})

        stats_text = (
            f"📊 *Your Statistics*\n\n"
            f"*Files:*\n"
            f"• Total: {files.get('total', 0)}\n"
            f"• Storage Used: {storage.get('used_formatted', '0 B')}\n"
            f"• Storage Available: {storage.get('available_formatted', 'N/A')}\n"
            f"• Usage: {storage.get('usage_percent', 0)}%\n\n"
            f"*Processing:*\n"
            f"• Processed: {stats.get('processed', 0)}\n"
            f"• Pending: {stats.get('pending', 0)}"
        )

        await stats_msg.edit_text(
            stats_text,
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("📁 My Files", callback_data="menu_files")],
                [InlineKeyboardButton("<< Back", callback_data="main_menu")]
            ])
        )

    except Exception as e:
        logger.error(f"Stats error: {e}")
        await stats_msg.edit_text(f"❌ Error: {str(e)}")


async def file_to_download_as_bytes(file) -> bytes:
    buffer = io.BytesIO()
    await file.download_to_memory(buffer)
    buffer.seek(0)
    return buffer.getvalue()


def _get_content_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    content_types = {
        "txt": "text/plain",
        "pdf": "application/pdf",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xls": "application/vnd.ms-excel",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "zip": "application/zip",
        "rar": "application/x-rar-compressed",
        "mp3": "audio/mpeg",
        "mp4": "video/mp4",
        "avi": "video/x-msvideo",
        "json": "application/json",
        "xml": "application/xml",
    }
    return content_types.get(ext, "application/octet-stream")


# ============================================================================
# Orion NAS — Folder & Storage Management Commands
# ============================================================================

async def handle_mkdir(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Create a folder: /mkdir foldername"""
    user = update.effective_user
    settings = Settings()
    api_client = APIClient(settings)

    if not context.args:
        await update.message.reply_text(
            "Usage: /mkdir foldername\n"
            "Example: /mkdir work\n"
            "Example: /mkdir projects/2025"
        )
        return

    folder_name = " ".join(context.args).strip()
    if not folder_name or "\\" in folder_name:
        await update.message.reply_text("❌ Invalid folder name.")
        return

    try:
        # Split into parent + name if contains /
        if "/" in folder_name:
            parts = folder_name.rsplit("/", 1)
            parent_path, name = parts[0], parts[1]
        else:
            parent_path, name = "", folder_name

        me = await api_client.get_me(user.id)
        current = me.get("current_folder", "") or ""
        if current and not parent_path:
            full_parent = current
        else:
            full_parent = parent_path

        result = await api_client.create_folder(user.id, name, full_parent)
        if result.get("success"):
            path = result.get("path", name)
            await update.message.reply_text(
                f"✅ Folder created: `/{path}/`",
                parse_mode="Markdown"
            )
        else:
            await update.message.reply_text(f"❌ {result.get('detail', 'Error creating folder')}")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")


async def handle_cd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Change directory: /cd foldername or /cd .. or /cd /"""
    user = update.effective_user
    settings = Settings()
    api_client = APIClient(settings)

    target = context.args[0] if context.args else ""

    try:
        me = await api_client.get_me(user.id)
        current = me.get("current_folder", "") or ""

        if target == "/":
            new_path = ""
        elif target == "..":
            new_path = "/".join(current.split("/")[:-1])
        elif not target:
            new_path = ""
        else:
            # Check if target exists as subfolder
            folders = await api_client.list_folders(user.id, current)
            folder_names = [f["name"] for f in folders.get("folders", [])]
            if target not in folder_names:
                await update.message.reply_text(f"❌ Folder '{target}' not found. Use /mkdir to create it first.")
                return
            new_path = f"{current}/{target}" if current else target

        result = await api_client.navigate_folder(user.id, new_path)
        display = f"/{new_path}" if new_path else "/ (root)"
        await update.message.reply_text(f"📂 Now in: `{display}`", parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")


async def handle_ls(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """List current folder: /ls"""
    user = update.effective_user
    settings = Settings()
    api_client = APIClient(settings)

    loading = await update.message.reply_text("📂 *Loading...*", parse_mode="Markdown")

    try:
        me = await api_client.get_me(user.id)
        current = me.get("current_folder", "") or ""

        folders_result = await api_client.list_folders(user.id, current)
        files_result = await api_client.list_files(user.id, current, limit=50)

        folders = folders_result.get("folders", [])
        files = files_result.get("files", [])

        display_path = f"/{current}" if current else "/"
        text = f"📂 **{display_path}**\n\n"

        if folders:
            text += "📁 *Folders:*\n"
            for f in folders:
                text += f"  📁 `{f['name']}/`\n"

        if files:
            text += "\n📄 *Files:*\n"
            for f in files:
                size = f.get("size_formatted") or _format_file_size(f.get("size", 0))
                text += f"  📄 `{f.get('file_name', '?')}` — {size}\n"

        if not folders and not files:
            text += "_Empty folder_"

        used = me.get("storage_used_formatted", "?")
        quota = me.get("quota_formatted", "?")
        percent = me.get("usage_percent", 0)
        bar = "▓" * min(int(percent / 5), 20) + "░" * max(20 - int(percent / 5), 0)
        text += f"\n\n💾 {used} / {quota} [{bar}] {percent}%"

        keyboard = []
        if current:
            keyboard.append([InlineKeyboardButton("↩️ Back", callback_data="cd_parent")])
        keyboard.append([InlineKeyboardButton("<< Menu", callback_data="main_menu")])

        await loading.edit_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    except Exception as e:
        await loading.edit_text(f"❌ Error: {str(e)}")


async def handle_rmdir(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Remove empty folder: /rmdir foldername"""
    user = update.effective_user
    settings = Settings()
    api_client = APIClient(settings)

    if not context.args:
        await update.message.reply_text("Usage: /rmdir foldername")
        return

    folder_name = context.args[0].strip()

    try:
        me = await api_client.get_me(user.id)
        current = me.get("current_folder", "") or ""

        folders = await api_client.list_folders(user.id, current)
        folder = next((f for f in folders.get("folders", []) if f["name"] == folder_name), None)

        if not folder:
            await update.message.reply_text(f"❌ Folder '{folder_name}' not found.")
            return

        result = await api_client.delete_folder(folder["id"], user.id)
        await update.message.reply_text(
            f"✅ Deleted folder: `{folder_name}/`",
            parse_mode="Markdown"
        )
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")


async def handle_move(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Move file to folder: /move file_id target_folder"""
    user = update.effective_user
    settings = Settings()
    api_client = APIClient(settings)

    if not context.args or len(context.args) < 2:
        await update.message.reply_text(
            "Usage: /move file_id folder\n"
            "Example: /move abc123 work"
        )
        return

    file_id = context.args[0]
    target = context.args[1]

    try:
        me = await api_client.get_me(user.id)
        current = me.get("current_folder", "") or ""
        new_path = f"{current}/{target}" if current else target

        result = await api_client.move_file(user.id, file_id, new_path)
        if result.get("success"):
            await update.message.reply_text(
                f"✅ Moved to `/{new_path}/`",
                parse_mode="Markdown"
            )
        else:
            await update.message.reply_text(f"❌ {result.get('detail', 'Error')}")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")


async def handle_copy(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Copy file to folder: /copy file_id target_folder"""
    user = update.effective_user
    settings = Settings()
    api_client = APIClient(settings)

    if not context.args or len(context.args) < 2:
        await update.message.reply_text(
            "Usage: /copy file_id folder\n"
            "Example: /copy abc123 archive"
        )
        return

    file_id = context.args[0]
    target = context.args[1]

    try:
        me = await api_client.get_me(user.id)
        current = me.get("current_folder", "") or ""
        new_path = f"{current}/{target}" if current else target

        result = await api_client.copy_file(user.id, file_id, new_path)
        if result.get("success"):
            await update.message.reply_text(
                f"✅ Copied to `/{new_path}/`",
                parse_mode="Markdown"
            )
        else:
            await update.message.reply_text(f"❌ {result.get('detail', 'Error')}")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")


async def handle_quota(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show storage quota: /quota"""
    user = update.effective_user
    settings = Settings()
    api_client = APIClient(settings)

    try:
        me = await api_client.get_me(user.id)

        used = me.get("storage_used_formatted", "0 B")
        quota = me.get("quota_formatted", "?")
        percent = me.get("usage_percent", 0)
        bar = "▓" * min(int(percent / 5), 20) + "░" * max(20 - int(percent / 5), 0)
        current = me.get("current_folder", "") or "/"

        text = (
            f"📊 *Orion Storage*\n\n"
            f"{used} / {quota}\n"
            f"[{bar}] {percent}%\n\n"
            f"*Current:* `/{current}`"
        )

        await update.message.reply_text(text, parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")


def _format_file_size(size_bytes: int) -> str:
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} PB"
