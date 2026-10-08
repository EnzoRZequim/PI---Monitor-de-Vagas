import { mkdir } from "node:fs/promises";

import {
  IMAGES_DIR,
  MAPS_DIR,
  OCCUPANCY_DIR,
  TEMP_DIR
} from "./paths";

export async function ensureDirectories(): Promise<void> {
  await Promise.all([
    mkdir(IMAGES_DIR, { recursive: true }),
    mkdir(MAPS_DIR, { recursive: true }),
    mkdir(OCCUPANCY_DIR, { recursive: true }),
    mkdir(TEMP_DIR, { recursive: true })
  ]);
}