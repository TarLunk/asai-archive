export type ProductBase = {
    last_update?: string;
    created?: string;
    pb_id?: number;
    method?: string;
    type?: string;
    google_sheets_link?: string;
    google_sheets_api_key?: string;
    skip_rows?: number;
    list_name?: string;
    search_scope?: number;
}