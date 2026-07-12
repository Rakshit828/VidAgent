import inngest
import logging

logging.basicConfig(
    level=logging.INFO,
    format="\n[%(asctime)s] [%(levelname)s] [%(name)s] [%(message)s]\n",
)
logger = logging.getLogger(__name__)


inngest_client = inngest.Inngest(app_id="vidagent-inngest-fastapi", logger=logger)
