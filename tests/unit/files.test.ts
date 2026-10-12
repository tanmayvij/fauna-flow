import { describe, expect, test } from "vitest";
import {
  formatFileSize,
  getFileExtension,
  hasAllowedExtension,
} from "@/lib/files";

describe("formatFileSize", () => {
  test.each([
    [0, "0 B"],
    [512, "512 B"],
    [1024, "1.0 KB"],
    [1536, "1.5 KB"],
    [5 * 1024 ** 2, "5.0 MB"],
  ])("formats %i bytes as %s", (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });
});

describe("getFileExtension", () => {
  test.each([
    ["usage.csv", ".csv"],
    ["INVENTORY.JSON", ".json"],
    ["archive.tar.txt", ".txt"],
    ["README", ""],
    [".env", ""],
  ])("returns the extension of %s", (fileName, expected) => {
    expect(getFileExtension(fileName)).toBe(expected);
  });
});

describe("hasAllowedExtension", () => {
  test("accepts listed extensions case-insensitively", () => {
    expect(hasAllowedExtension("Delivery.TXT", [".txt"])).toBe(true);
  });

  test("rejects unlisted extensions", () => {
    expect(hasAllowedExtension("usage.xlsx", [".csv"])).toBe(false);
  });
});
