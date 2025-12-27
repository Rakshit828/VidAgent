from pathlib import Path
from jinja2 import Environment, FileSystemLoader



BASE_DIR = Path(__file__).resolve().parent

templates_folder = Path(BASE_DIR, "templates")

jinja_env = Environment(loader=FileSystemLoader(templates_folder))

