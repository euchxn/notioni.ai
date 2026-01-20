"use client";

import { GeneratedTemplate, TemplateBlock } from "@/lib/prompts";

interface TemplatePreviewProps {
  template: GeneratedTemplate;
}

function BlockRenderer({ block }: { block: TemplateBlock }) {
  switch (block.type) {
    case "heading_1":
      return (
        <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">
          {block.content}
        </h1>
      );
    case "heading_2":
      return (
        <h2 className="text-xl font-semibold text-gray-900 mt-5 mb-2">
          {block.content}
        </h2>
      );
    case "heading_3":
      return (
        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
          {block.content}
        </h3>
      );
    case "paragraph":
      return <p className="text-gray-700 my-2">{block.content}</p>;
    case "bulleted_list_item":
      return (
        <li className="text-gray-700 ml-4 list-disc">{block.content}</li>
      );
    case "numbered_list_item":
      return (
        <li className="text-gray-700 ml-4 list-decimal">{block.content}</li>
      );
    case "to_do":
      return (
        <div className="flex items-center gap-2 my-1">
          <input
            type="checkbox"
            checked={block.checked}
            readOnly
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-gray-700">{block.content}</span>
        </div>
      );
    case "divider":
      return <hr className="my-4 border-gray-200" />;
    case "callout":
      return (
        <div className="bg-gray-100 border-l-4 border-yellow-400 p-4 my-3 rounded-r">
          <p className="text-gray-700">{block.content}</p>
        </div>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 my-3 italic text-gray-600">
          {block.content}
        </blockquote>
      );
    default:
      return <p className="text-gray-700 my-2">{block.content}</p>;
  }
}

export default function TemplatePreview({ template }: TemplatePreviewProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        {template.icon && (
          <span className="text-3xl">{template.icon}</span>
        )}
        <h2 className="text-2xl font-bold text-gray-900">{template.title}</h2>
      </div>

      <div className="space-y-1">
        {template.blocks.map((block, index) => (
          <BlockRenderer key={index} block={block} />
        ))}
      </div>

      {template.database && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            {template.database.title}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {Object.entries(template.database.properties).map(
                    ([name, prop]) => (
                      <th
                        key={name}
                        className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700"
                      >
                        {name}
                        <span className="ml-1 text-xs text-gray-400">
                          ({prop.type})
                        </span>
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {Object.entries(template.database.properties).map(
                    ([name, prop]) => (
                      <td
                        key={name}
                        className="border border-gray-300 px-3 py-2 text-gray-500"
                      >
                        {prop.type === "select" && prop.options
                          ? prop.options.join(" / ")
                          : prop.type === "checkbox"
                            ? "[ ]"
                            : prop.type === "date"
                              ? "YYYY-MM-DD"
                              : "..."}
                      </td>
                    )
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
