/**
 * 限定业务稿的 import 来源:
 *   - 通过 config option 传入的 preset 包（如 @omit-design/preset-mobile）
 *   - react / react-dom / react-router / react-router-dom
 *   - ionicons/icons（图标常量）
 *   - @ionic/react 只允许 named import:IonList / IonBackButton / IonIcon
 *   - 同目录 / 父目录的相对 import（稿内 shell / mock 互相引用）
 *
 * Config:
 *   "omit-design/whitelist-ds-import": ["error", { presets: ["@omit-design/preset-mobile"] }]
 */

const STATIC_BARE_ALLOWED = new Set([
  "react",
  "react-dom",
  "react-router",
  "react-router-dom",
  "ionicons/icons",
]);

const IONIC_ALLOWED_NAMED = new Set(["IonList", "IonBackButton", "IonIcon"]);

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "业务稿只能 import 白名单来源;@ionic/react 限定 IonList/IonBackButton/IonIcon。Preset 包名通过 config option `presets` 传入。",
    },
    messages: {
      forbiddenSource:
        "禁止 import '{{source}}'。允许:preset 包（{{presets}}）、react、react-router(-dom)、ionicons/icons、@ionic/react (IonList/IonBackButton/IonIcon)、相对路径。",
      forbiddenIonicNamed:
        "从 @ionic/react 只允许 import IonList / IonBackButton / IonIcon,'{{name}}' 不在白名单。需要视觉组件请到 preset 包里加白名单封装。",
    },
    schema: [
      {
        type: "object",
        properties: {
          presets: {
            type: "array",
            items: { type: "string" },
            description: "允许业务稿 import 的 preset 包名列表",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const opts = context.options[0] ?? {};
    const presetPackages = new Set(opts.presets ?? []);
    const presetList = Array.from(presetPackages).join(", ") || "（未配置）";

    function isPresetSubpath(source) {
      for (const pkg of presetPackages) {
        if (source === pkg) return true;
        if (source.startsWith(pkg + "/")) return true;
      }
      return false;
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        if (source.startsWith("./") || source.startsWith("../")) return;

        if (source === "@ionic/react") {
          for (const spec of node.specifiers) {
            if (spec.type === "ImportSpecifier") {
              const imported = spec.imported.name;
              if (!IONIC_ALLOWED_NAMED.has(imported)) {
                context.report({
                  node: spec,
                  messageId: "forbiddenIonicNamed",
                  data: { name: imported },
                });
              }
            }
          }
          return;
        }

        if (STATIC_BARE_ALLOWED.has(source)) return;
        if (isPresetSubpath(source)) return;

        context.report({
          node: node.source,
          messageId: "forbiddenSource",
          data: { source, presets: presetList },
        });
      },
    };
  },
};
