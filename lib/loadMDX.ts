// lib/loadMDX.ts
import fs from "fs";
import { compileMDX } from "next-mdx-remote/rsc";

export async function loadMDXComponent(filePath: string) {
  const mdxSource = fs.readFileSync(filePath, "utf8");

  const { content, frontmatter } = await compileMDX({
    source: mdxSource,
    // options: { parseFrontmatter: true },
  });

  // content тут – вже React-компонент
  return { Content: content, frontmatter };
}