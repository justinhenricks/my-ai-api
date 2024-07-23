import fs from "fs";
// import { PDFLoader } from "langchain/document_loaders/fs/pdf";
// import { YoutubeLoader } from "langchain/document_loaders/web/youtube";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import path from "path";
import { DATA_DIR } from "../constants";
import { db } from "../db";
import { vectorStore } from "../services/ai";
import { TextLoader } from "langchain/document_loaders/fs/text";

const youtubeURLs = [
  "https://www.youtube.com/watch?v=ynvldrONHOM", //5 benson licks
  "https://www.youtube.com/watch?v=oYWuGU_NYCM", //just for me al green tutorial
  "https://www.youtube.com/watch?v=79J4SAa31zk", //what they do by the roots tutorial
  "https://www.youtube.com/watch?v=bZiD0vZduAQ", //barry harris ideas
  "https://www.youtube.com/watch?v=6pr-vudBBl8", //the Root Dangelo
  "https://www.youtube.com/watch?v=TxSxd2sFDl8", //scofield rhyhtm changes
  // ... add more URLs as needed
];

export async function doEmbeddings() {
  try {
    console.log("Doing embeddings 🤓");

    const documents = [];
    for (const file of resourceRegistry) {
      const doc = await loadDocument(file);
      documents.push(...doc);
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await textSplitter.splitDocuments(documents);

    await db.$queryRawUnsafe(`Truncate "Document" restart identity cascade;`);

    await vectorStore.addModels(
      await db.$transaction(
        splitDocs.map((content) =>
          db.document.create({ data: { content: content.pageContent } })
        )
      )
    );
  } catch (err) {
    console.error("❌ Error doing embeddings", err);
  }
}

// Define the types and interfaces
interface FileResource {
  path: string;
  type: "text" | "json" | "pdf";
}

interface YoutubeResource {
  url: string;
  type: "youtube";
}

type Resource = FileResource | YoutubeResource;

// Auto-build the file registry based on file extensions
const dirPath = DATA_DIR;
const files = fs.readdirSync(dirPath);
const fileResources: FileResource[] = files
  .map((file) => {
    const ext = path.extname(file).toLowerCase();
    let type: FileResource["type"];

    switch (ext) {
      case ".txt":
        type = "text";
        break;
      case ".json":
        type = "json";
        break;
      case ".pdf":
        type = "pdf";
        break;
      default:
        return null;
    }

    return { path: path.join(dirPath, file), type };
  })
  .filter(Boolean) as FileResource[]; // Filter out null entries and assert the type

const youtubeResources: YoutubeResource[] = youtubeURLs.map((url) => {
  return { url, type: "youtube" };
});

const resourceRegistry: Resource[] = [...fileResources];

async function loadDocument(resource: Resource) {
  switch (resource.type) {
    case "text":
      return new TextLoader(resource.path).load();
    //TODO: add back in other types
    case "json":
      return new JSONLoader(resource.path).load();
    // case "pdf":
    //   return new PDFLoader(resource.path).load();
    // case "youtube":
    //   const youtubeLoader = YoutubeLoader.createFromUrl(resource.url, {
    //     language: "en",
    //     addVideoInfo: true,
    //   });
    //   return youtubeLoader.load();
    default:
      // Exhaustive type checking. If a new resource type is added and not handled, this will error
      //@ts-ignore
      const _exhaustiveCheck: never = resource;
      return _exhaustiveCheck;
  }
}
