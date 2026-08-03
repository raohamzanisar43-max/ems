from rest_framework.pagination import PageNumberPagination


class DefaultPagination(PageNumberPagination):
    """Same 10/page default as before, but callers can opt into a bigger page
    (e.g. a dashboard that needs every record for its charts) via ?page_size=."""
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 500
