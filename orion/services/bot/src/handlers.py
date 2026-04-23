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
        f"🌟 *Welcome to Orion File Storage!*",
        parse_mode="Markdown",
        reply_markup=await get_main_menu_keyboard()
    )


async def handle_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    help_text = """
📖 *Orion File Storage Help*

*Available Commands:*

/start - Start the bot
/help - Show this help message
/upload - Upload a file (reply to this message with a file)
/list - List your uploaded files
/get [file_id] - Download a file by ID
/delete [file_id] - Delete a file
/search [query] - Search files by name or tag
/status - Check system status
/stats - View storage statistics

*Tips:*
• You can also just send any file directly to upload it
• Use /search to find files quickly
• Check /stats to see your storage usage

Need more help? Contact an admin!
    """
    await update.message.reply_text(
        help_text,
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("<< Back to Menu", callback_data="main_menu")]
        ])
    )


async def handle_upload(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.message
    user = update.effective_user
    
    settings = Settings()
    api_client = APIClient(settings)

    uploading_msg = await message.reply_text("📤 *Uploading file...*", parse_mode="Markdown")

    try:
        file_to_upload = None
        file_name = None
        
        if message.document:
            file_to_upload = await message.document.get_file()
            file_name = message.document.file_name
        elif message.photo:
            file_to_upload = await message.photo[-1].get_file()
            file_name = f"photo_{file_to_upload.file_id}.jpg"
        else:
            await uploading_msg.edit_text(
                "❌ Please send a valid file (document or photo).",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("<< Back", callback_data="main_menu")]
                ])
            )
            return

        if file_to_upload is None:
            await uploading_msg.edit_text("❌ Failed to get file. Please try again.")
            return

        file_bytes = await file_to_download_as_bytes(file_to_upload)
        content_type = _get_content_type(file_name)

        result = await api_client.upload_file(
            telegram_id=user.id,
            file_name=file_name,
            file_content=file_bytes,
            content_type=content_type,
            tags=None
        )

        if result.get("success"):
            await uploading_msg.edit_text(
                f"✅ *File uploaded successfully!*\n\n"
                f"📄 File ID: `{result.get('file_id')}`\n"
                f"📁 Name: {result.get('file_name')}\n"
                f"💾 Size: {result.get('size_formatted')}\n"
                f"🕐 Uploaded: {result.get('created_at')}",
                parse_mode="Markdown",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("📁 My Files", callback_data="menu_files")],
                    [InlineKeyboardButton("<< Back", callback_data="main_menu")]
                ])
            )
        else:
            await uploading_msg.edit_text(
                f"❌ Upload failed: {result.get('error', 'Unknown error')}",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("<< Back", callback_data="main_menu")]
                ])
            )

    except Exception as e:
        logger.error(f"Upload error: {e}")
        await uploading_msg.edit_text(
            f"❌ Error uploading file: {str(e)}",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("<< Back", callback_data="main_menu")]
            ])
        )


async def handle_url_download(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Auto-download files from URLs sent in chat."""
    message = update.message
    user = update.effective_user
    settings = Settings()
    api_client = APIClient(settings)

    text = (message.text or message.caption or "").strip()
    if not text:
        return

    # Find URLs in message text
    url_pattern = re.compile(
        r"https?://[^\s<>\"\']+(?:\.[^\s<>\"\']+)*", re.IGNORECASE
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

            # Determine file name from URL or content-disposition
            parsed_url = httpx.URL(url)
            file_name = parsed_url.params.get("filename", "")
            if not file_name:
                # Try content-disposition
                cd = response.headers.get("content-disposition", "")
                match = re.search(r'filename[^;=\n]*=(?:\\?["\'])?([^;\n]*)', cd)
                if match:
                    file_name = match.group(1).strip('"\' ')
                else:
                    file_name = parsed_url.path.split("/")[-1] or "download"

            content_type = response.headers.get("content-type", "application/octet-stream")
            content_type = content_type.split(";")[0].strip()

            # Handle no-extension filenames
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
                    f"✅ *Downloaded & uploaded!*:\n\n"
                    f"📄 File ID: `{result.get('file_id')}`\n"
                    f"📁 Name: {result.get('file_name')}\n"
                    f"💾 Size: {result.get('size_formatted')}",
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
            
            files_text += f"{idx + 1}. 📄 `{file_id}`\n   {file_name}\n   💾 {size} • {created}\n\n"
            
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
            files_text += f"{idx + 1}. 📄 `{file_id}`\n   {file_name}\n\n"
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
            f"⚙️ *Orion System Status*\n\n"
            f"*API:* {'✅ Online' if status.get('api') else '❌ Offline'}\n"
            f"*Uptime:* {status.get('uptime', 'N/A')}\n"
            f"*Database:* {'✅ Connected' if status.get('database') else '❌ Disconnected'}\n"
            f"*Storage:* {'✅ Available' if status.get('storage') else '❌ Error'}\n\n"
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