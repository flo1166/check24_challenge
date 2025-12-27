import logging
import sys
import os
from pathlib import Path

# Create logs directory with absolute path resolution
# Get the project root (3 levels up from this file)
project_root = Path(__file__).resolve().parent.parent.parent
logs_dir = project_root / "logs"

# Ensure logs directory exists
try:
    logs_dir.mkdir(parents=True, exist_ok=True)
    print(f"✓ Logs directory created/verified at: {logs_dir}")
except Exception as e:
    print(f"✗ Error creating logs directory: {e}")
    # Fallback to current working directory
    logs_dir = Path.cwd() / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    print(f"✓ Using fallback logs directory: {logs_dir}")

LOG_FILE = logs_dir / "core-service.log"

# Print where we're logging (visible in console immediately)
print(f"\n{'='*60}")
print(f"LOGGING TO: {LOG_FILE.absolute()}")
print(f"Log file exists: {LOG_FILE.exists()}")
print(f"{'='*60}\n")

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {
            "format": "%(asctime)s | %(name)s | %(levelname)s | %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S"
        },
        "detailed": {
            "format": "%(asctime)s | %(name)s | %(levelname)s | [%(filename)s:%(lineno)d] | %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "DEBUG",
            "formatter": "detailed",
            "stream": "ext://sys.stdout"
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "DEBUG",
            "formatter": "detailed",
            "filename": str(LOG_FILE),
            "mode": "a",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "encoding": "utf-8"
        }
    },
    "root": {
        "level": "DEBUG",
        "handlers": ["console", "file"]
    },
    "loggers": {
        "uvicorn": {
            "level": "INFO",
            "handlers": ["console", "file"],
            "propagate": False
        },
        "uvicorn.access": {
            "level": "INFO",
            "handlers": ["console", "file"],
            "propagate": False
        },
        "uvicorn.error": {
            "level": "INFO",
            "handlers": ["console", "file"],
            "propagate": False
        }
    }
}

# Test logging immediately
def test_logging():
    """Test that logging is actually working"""
    from logging.config import dictConfig
    dictConfig(LOGGING_CONFIG)
    test_logger = logging.getLogger(__name__)
    test_logger.info("✓ Logging system initialized successfully")
    test_logger.debug("✓ Debug logging is working")
    print(f"✓ Test log written to: {LOG_FILE}")

if __name__ == "__main__":
    test_logging()