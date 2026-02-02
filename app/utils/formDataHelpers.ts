export type FormDataFields = Record<string, string | number | boolean | null | undefined>;
export type FormDataFiles = Record<string, File | null | undefined>;

// Build FormData from fields and files
export function buildFormData(fields: FormDataFields, files: FormDataFiles = {}): FormData {
    const formData = new FormData();

    for (const [key, value] of Object.entries(fields)) {
        if (value === null || value === undefined) continue;
        formData.append(key, String(value));
    }

    for (const [key, file] of Object.entries(files)) {
        if (!file) continue;
        formData.append(key, file);
    }

    return formData;
}
