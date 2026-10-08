import path from "node:path";
export const ROOT_DIR = path.resolve(__dirname, "../../..");

export const DATA_DIR = path.join(ROOT_DIR, "data");
export const IMAGES_DIR = path.join(DATA_DIR, "images");
export const MAPS_DIR = path.join(DATA_DIR, "maps");
export const OCCUPANCY_DIR = path.join(DATA_DIR, "occupancy");
export const TEMP_DIR = path.join(DATA_DIR, "temp");