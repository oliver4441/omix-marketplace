import os
import logging
import asyncio
from typing import Optional

from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    InputFile,
    constants,
)
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)

from config import Settings
from api_client import APIClient
from handlers import (
    handle_start,
    handle_help,
    handle_upload,
    handle_list,
    handle_get,
    handle_delete,
    handle_search,
    handle_status,
    handle_stats,
    handle_url_download,
    handle_mkdir,
    handle_cd,
    handle_ls,
    handle_rmdir,
    handle_move,
    handle_copy,
    handle_quota,
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


async def post_init(application: Application) -> None:
    await application.bot.set_my_commands([
        ("start", "Start the bot"),
        ("help", "Show help message"),
        ("mkdir", "Create a folder"),
        ("cd", "Go to folder"),
        ("ls", "Browse folder"),
        ("rmdir", "Delete empty folder"),
        ("upload", "Upload a file"),
        ("list", "List your files"),
        ("get", "Download a file"),
        ("delete", "Delete a file"),
        ("move", "Move file to folder"),
        ("copy", "Copy file to folder"),
        ("quota", "Storage usage"),
        ("search", "Search files"),
        ("stats", "Storage statistics"),
        ("status", "System status"),
    ])


async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.error(f"Exception while handling an update: {context.error}")
    if update and update.effective_message:
        await update.effective_message.reply_text(
            "An error occurred. Please try again.",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("<< Back", callback_data="main_menu")]
            ])
        )


async def health_check(request, service: str = "bot") -> dict:
    api_url = os.getenv("API_BASE_URL", "http://127.0.0.1:8080")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{api_url}/health", timeout=5.0)
            return {"status": "healthy", "api": "connected"} if response.status_code == 200 else {"status": "unhealthy", "api": "disconnected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


def main() -> None:
    import asyncio
    # Ensure there's an event loop for Python 3.14+
    try:
        asyncio.get_event_loop()
    except RuntimeError:
        asyncio.set_event_loop(asyncio.new_event_loop())
    settings = Settings()
    api_client = APIClient(settings)

    application = (
        Application.builder()
        .token(settings.bot_token)
        .post_init(post_init)
        .build()
    )

    application.add_handler(CommandHandler("mkdir", handle_mkdir))
    application.add_handler(CommandHandler("cd", handle_cd))
    application.add_handler(CommandHandler("ls", handle_ls))
    application.add_handler(CommandHandler("rmdir", handle_rmdir))
    application.add_handler(CommandHandler("move", handle_move))
    application.add_handler(CommandHandler("copy", handle_copy))
    application.add_handler(CommandHandler("quota", handle_quota))
    application.add_handler(CommandHandler("start", handle_start))
    application.add_handler(CommandHandler("help", handle_help))
    application.add_handler(CommandHandler("upload", handle_upload))
    application.add_handler(CommandHandler("list", handle_list))
    application.add_handler(CommandHandler("get", handle_get))
    application.add_handler(CommandHandler("delete", handle_delete))
    application.add_handler(CommandHandler("search", handle_search))
    application.add_handler(CommandHandler("status", handle_status))
    application.add_handler(CommandHandler("stats", handle_stats))

    application.add_handler(
        CallbackQueryHandler(handle_start, pattern="main_menu")
    )

    # ── Auto-upload: any media sent directly gets uploaded ──────────────────
    # Covers: document, photo, video, audio, voice, video_note
    application.add_handler(
        MessageHandler(
            (
                filters.Document.ALL
                | filters.PHOTO
                | filters.VIDEO
                | filters.AUDIO
                | filters.VOICE
                | filters.VIDEO_NOTE
            ),
            handle_upload,
        ),
        group=1,
    )

    # ── Auto-download: any URL in text gets fetched and saved ───────────────
    application.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, handle_url_download),
        group=2,
    )

    application.add_error_handler(error_handler)

    logger.info("Starting Orion Telegram Bot Service...")
    application.run_polling(allowed_updates=None)


if __name__ == "__main__":
    main()