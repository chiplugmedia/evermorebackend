import fs from "fs";
import path from "path";

export async function saveRegistration(data) {
  const fileName = `${Date.now()}.txt`;

  const filePath = path.join(process.cwd(), "registrations", fileName);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  return fileName;
}
