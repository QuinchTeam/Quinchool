class Crawl4AiUnavailableError(Exception):
    def __init__(self, cause: object = None) -> None:
        super().__init__("Crawl4AI is unavailable")
        self.cause: object = cause
