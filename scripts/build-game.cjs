#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function toIsoDate(dateString) {
  if (!dateString) return null;
  const parts = String(dateString).trim();
  if (!parts) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) return parts;

  const normalized = parts.replace(/:/g, "-");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;

  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function readExifDate(buffer) {
  try {
    if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

    let offset = 2;
    while (offset + 4 < buffer.length) {
      if (buffer[offset] !== 0xff) return null;
      const marker = buffer[offset + 1];
      if (marker === 0xda) break; // SOS

      const size = buffer.readUInt16BE(offset + 2);
      if (marker === 0xe1) {
        const exifStart = offset + 4;
        if (buffer.toString("ascii", exifStart, exifStart + 6) !== "Exif\0\0") {
          offset += 2 + size;
          continue;
        }

        const tiff = exifStart + 6;
        const endian = buffer.toString("ascii", tiff, tiff + 2);
        const readUInt16 = endian === "II" ? buffer.readUInt16LE.bind(buffer) : buffer.readUInt16BE.bind(buffer);
        const readUInt32 = endian === "II" ? buffer.readUInt32LE.bind(buffer) : buffer.readUInt32BE.bind(buffer);

        const firstIfdOffset = readUInt32(tiff + 4);
        const ifd0 = tiff + firstIfdOffset;
        const entries = readUInt16(ifd0);

        let exifIfdOffset = null;
        for (let i = 0; i < entries; i += 1) {
          const entryOffset = ifd0 + 2 + i * 12;
          const tag = readUInt16(entryOffset);
          if (tag === 0x8769) {
            exifIfdOffset = readUInt32(entryOffset + 8);
            break;
          }
        }

        if (!exifIfdOffset) return null;

        const exifIfd = tiff + exifIfdOffset;
        const exifEntries = readUInt16(exifIfd);

        for (let i = 0; i < exifEntries; i += 1) {
          const entryOffset = exifIfd + 2 + i * 12;
          const tag = readUInt16(entryOffset);
          if (tag !== 0x9003) continue; // DateTimeOriginal

          const type = readUInt16(entryOffset + 2);
          const count = readUInt32(entryOffset + 4);
          const valueOffset = entryOffset + 8;

          if (type !== 2 || count < 10) return null; // ASCII

          const valuePointer = count <= 4 ? valueOffset : tiff + readUInt32(valueOffset);
          const raw = buffer.toString("ascii", valuePointer, valuePointer + count - 1).trim();
          return toIsoDate(raw);
        }

        return null;
      }

      offset += 2 + size;
    }
  } catch {
    return null;
  }

  return null;
}

function loadAnswers(answersPath) {
  if (!answersPath) return null;
  const raw = fs.readFileSync(answersPath, "utf8");
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    const byName = {};
    parsed.forEach((entry) => {
      if (!entry || !entry.file) return;
      byName[entry.file] = entry;
    });
    return byName;
  }

  return parsed;
}

function normalizeAnswerEntry(entry) {
  if (!entry) return {};
  if (typeof entry === "string") return { correct_date: entry };
  return entry;
}

function parseArgs(args) {
  const options = {
    images: null,
    out: path.join(process.cwd(), "public", "data", "game"),
    name: "game",
    screenName: null,
    password: "",
    answers: null,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = args[i + 1];
    if (!arg.startsWith("--")) continue;

    switch (arg) {
      case "--images":
        options.images = next;
        i += 1;
        break;
      case "--out":
        options.out = next;
        i += 1;
        break;
      case "--name":
        options.name = next;
        i += 1;
        break;
      case "--screen-name":
        options.screenName = next;
        i += 1;
        break;
      case "--password":
        options.password = next;
        i += 1;
        break;
      case "--answers":
        options.answers = next;
        i += 1;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      default:
        break;
    }
  }

  if (!options.images) {
    throw new Error("Missing --images <folder>.");
  }

  if (!options.screenName) options.screenName = options.name;

  return options;
}

function defaultLabel(fileName) {
  const base = path.parse(fileName).name;
  return base.replace(/[_-]+/g, " ").trim();
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const imagesDir = path.resolve(options.images);
  const outDir = path.resolve(options.out);
  const outImagesDir = path.join(outDir, "images");

  if (!fs.existsSync(imagesDir)) {
    throw new Error(`Images folder not found: ${imagesDir}`);
  }

  if (!options.dryRun) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.mkdirSync(outImagesDir, { recursive: true });
  }

  const answers = loadAnswers(options.answers);

  const files = fs
    .readdirSync(imagesDir)
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  if (!files.length) {
    throw new Error("No images found in the source folder.");
  }

  const images = files.map((file, index) => {
    const sourcePath = path.join(imagesDir, file);
    if (!options.dryRun) {
      const outputPath = path.join(outImagesDir, file);
      fs.copyFileSync(sourcePath, outputPath);
    }

    const buffer = fs.readFileSync(sourcePath);
    const exifDate = readExifDate(buffer);

    const answerEntry = normalizeAnswerEntry(answers ? answers[file] : null);
    const answerDate = toIsoDate(exifDate || answerEntry.correct_date);

    return {
      id: index,
      answer_type: "date",
      image_path: `images/${file}`,
      image_description: answerEntry.description || defaultLabel(file),
      image_quesiton: answerEntry.question || "När togs bilden?",
      correct_answer: answerDate || "",
    };
  });

  const payload = {
    type: "game",
    name: options.name,
    screen_name: options.screenName,
    session_password: options.password,
      images,
    };

  if (!options.dryRun) {
    fs.writeFileSync(
      path.join(outDir, "data.json"),
      `${JSON.stringify(payload, null, 2)}\n`,
      "utf8"
    );
  }

  if (options.dryRun) {
    console.log(`Dry run: processed ${images.length} images.`);
    return;
  }

  console.log(`Game built with ${images.length} images.`);
  console.log(`Output: ${outDir}`);
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  console.log(
    "\nUsage: node scripts/build-game.cjs --images <folder> [--out public/data/game] [--screen-name \"Party Game\"] [--password SECRET] [--answers answers.json] [--dry-run]"
  );
  process.exit(1);
}
