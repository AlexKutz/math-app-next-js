import fs from "fs";
import path from "path";
import { MDXRemote } from "next-mdx-remote/rsc";
import { loadMDXComponent } from "@/lib/loadMDX";
// import { loadTasks } from "@/lib/loadTasks";
// import TaskRenderer from "@/components/TaskRenderer";

interface Props {
  params: {
    topic: string;
  };
}

export async function generateStaticParams() {
  const basePath = path.join(process.cwd(), "content/math");
  const topics = fs.readdirSync(basePath, { withFileTypes: true });

  return topics
    .filter(entry => entry.isDirectory())
    .map(entry => ({ topic: entry.name }));
}

export default async function LessonPage(
  props: Promise<{
    params: { topic: string };
  }>
) {
  const { params } = await props;
  const { topic } = await params;

  console.log(topic)

  const lessonPath = path.join(process.cwd(), "content/math", topic);

  const mdxPath = path.join(lessonPath, "index.mdx");
  const tasksPath = path.join(lessonPath, "tasks");

  const hasTheory = fs.existsSync(mdxPath);

  // Завантаження теорії (якщо є)
  let theory: string | null = null;
  let Content: React.ComponentType | null = null;
  if (hasTheory) {
    const result = await loadMDXComponent(mdxPath);
    Content = result.Content;
  }

  // Завантаження задач
//   const tasks = fs.existsSync(tasksPath)
//     ? await loadTasks(tasksPath)
//     : [];

  return (
    <div className="mx-auto max-w-3xl py-10">
      {/* Теорія */}
      {theory ? (
        <article className="prose prose-neutral dark:prose-invert">
          <Content />
        </article>
      ) : (
        <div className="mb-8 p-4 rounded bg-yellow-100 text-black">
          <strong>Теорія відсутня</strong>. Перейди одразу до практики.
        </div>
      )}

      {/* Задачі */}
      {/* <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Практика</h2>

        {tasks.length === 0 ? (
          <p>Для цієї теми поки немає завдань.</p>
        ) : (
          <div className="space-y-6">
            {tasks.map(task => (
              <TaskRenderer key={task.id} task={task} />
            ))}
          </div>
        )}
      </section> */}
    </div>
  );
}
