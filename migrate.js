
    /*
    MIT License
    
    Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
    Mindoro State University - Philippines

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
    */
    
import mongoose from "mongoose";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const DB_NAME = "barangay";
const DB_URI = `mongodb://127.0.0.1:27017/${DB_NAME}`;

const modelsPath = path.join(process.cwd(), "models");
const modelFiles = fs.readdirSync(modelsPath).filter(f => f.endsWith(".js"));

const models = {};
for (const file of modelFiles) {
  const mod = await import(pathToFileURL(path.join(modelsPath, file)).href);
  const modelName = Object.keys(mod)[0];
  models[modelName] = mod[modelName];
}

const { createDb } = await inquirer.prompt([
  { type: "confirm", name: "createDb", message: "Database 'barangay' may not exist. Create it?", default: true }
]);

if (!createDb) return console.log("❌ Migration aborted.");

await mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
console.log("✅ MongoDB connected!");

for (const [name, model] of Object.entries(models)) {
  const exists = await model.findOne();
  if (!exists) {
    await model.create({});
    await model.deleteMany({});
    console.log(`✅ Collection '${name}' created`);
  }
}

console.log("✅ MongoDB migration completed!");
process.exit();
