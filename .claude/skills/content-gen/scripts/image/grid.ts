import path from "node:path";
import process from "node:process";
import { access, mkdir, readFile } from "node:fs/promises";

export type GridType = "3x3" | "2x2";

export interface GridConfig {
  type: GridType;
  rows: number;
  cols: number;
  labels: string[][];
}

const GRID_CONFIGS: Record<GridType, GridConfig> = {
  "3x3": {
    type: "3x3",
    rows: 3,
    cols: 3,
    labels: [
      ["cell_1_1", "cell_1_2", "cell_1_3"],
      ["cell_2_1", "cell_2_2", "cell_2_3"],
      ["cell_3_1", "cell_3_2", "cell_3_3"],
    ],
  },
  "2x2": {
    type: "2x2",
    rows: 2,
    cols: 2,
    labels: [
      ["cell_1_1", "cell_1_2"],
      ["cell_2_1", "cell_2_2"],
    ],
  },
};

export function getGridConfig(type: GridType): GridConfig {
  return GRID_CONFIGS[type];
}

// ─── Composite Layout Types ───

export type PanelType =
  | "character"      // 人物参考图
  | "scene"          // 场景参考图
  | "action"         // 动作分解图
  | "custom";        // 自定义内容

export interface Panel {
  type: PanelType;
  label: string;
  content: string;   // 该面板的详细描述
  rows?: number;     // 该面板内部的行数（用于网格子分割）
  cols?: number;     // 该面板内部的列数
  subLabels?: string[][]; // 子标签（如三视图的正面/侧面/背面）
}

export type CompositeLayout =
  | { kind: "horizontal"; panels: Panel[] }      // 上中下/左中右排列
  | { kind: "grid"; rows: number; cols: number; panels: Panel[] }
  | { kind: "asymmetric"; panels: Panel[]; leftRatio: number; right: { rows: number; cols: number; panels: Panel[] } };

// ─── Grid Splitting ───

export async function splitGrid(
  inputPath: string,
  outputDir: string,
  gridType: GridType,
  prefix?: string,
): Promise<string[]> {
  const config = getGridConfig(gridType);
  const imageBytes = await readFile(inputPath);

  try {
    const sharp = await import("sharp");
    const img = sharp.default(imageBytes);
    const metadata = await img.metadata();
    const width = metadata.width!;
    const height = metadata.height!;

    const cellWidth = Math.floor(width / config.cols);
    const cellHeight = Math.floor(height / config.rows);

    const outputPaths: string[] = [];
    await mkdir(outputDir, { recursive: true });

    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        const left = col * cellWidth;
        const top = row * cellHeight;
        const label = config.labels[row]![col]!;
        const filename = prefix ? `${prefix}_${label}.png` : `${label}.png`;
        const outputPath = path.join(outputDir, filename);

        await img
          .clone()
          .extract({ left, top, width: cellWidth, height: cellHeight })
          .png()
          .toFile(outputPath);

        outputPaths.push(outputPath);
      }
    }

    return outputPaths;
  } catch {
    try {
      const jimp = await import("jimp");
      const image = await jimp.default.read(Buffer.from(imageBytes));
      const width = image.getWidth();
      const height = image.getHeight();

      const cellWidth = Math.floor(width / config.cols);
      const cellHeight = Math.floor(height / config.rows);

      const outputPaths: string[] = [];
      await mkdir(outputDir, { recursive: true });

      for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
          const left = col * cellWidth;
          const top = row * cellHeight;
          const label = config.labels[row]![col]!;
          const filename = prefix ? `${prefix}_${label}.png` : `${label}.png`;
          const outputPath = path.join(outputDir, filename);

          const cropped = image.clone().crop(left, top, cellWidth, cellHeight);
          await cropped.writeAsync(outputPath);

          outputPaths.push(outputPath);
        }
      }

      return outputPaths;
    } catch {
      throw new Error(
        "Image splitting requires 'sharp' or 'jimp' package. " +
          "Install one of them: npm install sharp (recommended) or npm install jimp",
      );
    }
  }
}

/**
 * Split an image by custom panel definitions.
 * Each panel defines a rectangular region to extract.
 */
export async function splitByPanels(
  inputPath: string,
  outputDir: string,
  panels: Array<{ name: string; left: number; top: number; width: number; height: number }>,
  prefix?: string,
): Promise<string[]> {
  const imageBytes = await readFile(inputPath);

  try {
    const sharp = await import("sharp");
    const img = sharp.default(imageBytes);
    const metadata = await img.metadata();
    const imgWidth = metadata.width!;
    const imgHeight = metadata.height!;

    const outputPaths: string[] = [];
    await mkdir(outputDir, { recursive: true });

    for (const panel of panels) {
      const left = Math.floor(panel.left * imgWidth);
      const top = Math.floor(panel.top * imgHeight);
      const width = Math.floor(panel.width * imgWidth);
      const height = Math.floor(panel.height * imgHeight);

      const filename = prefix ? `${prefix}_${panel.name}.png` : `${panel.name}.png`;
      const outputPath = path.join(outputDir, filename);

      await img
        .clone()
        .extract({ left, top, width, height })
        .png()
        .toFile(outputPath);

      outputPaths.push(outputPath);
    }

    return outputPaths;
  } catch {
    throw new Error(
      "Panel splitting requires 'sharp' package. Install: npm install sharp",
    );
  }
}

// ─── Prompt Builders ───

export function buildGridPrompt(
  gridType: GridType,
  contentDesc: string,
  options?: {
    labels?: string[][];
    style?: string;
    background?: string;
    extraInstructions?: string;
  },
): string {
  const config = getGridConfig(gridType);
  const labels = options?.labels || config.labels;

  let prompt = `Create a ${gridType} grid image. The image is a single picture divided into ${config.rows} rows and ${config.cols} columns (${gridType}).\n\n`;

  prompt += `Grid layout:\n`;
  for (let row = 0; row < config.rows; row++) {
    prompt += `Row ${row + 1}:`;
    for (let col = 0; col < config.cols; col++) {
      prompt += ` [${labels[row]?.[col] || `cell_${row + 1}_${col + 1}`}]`;
    }
    prompt += `\n`;
  }

  prompt += `\nContent description:\n${contentDesc}\n`;

  if (options?.style) {
    prompt += `\nStyle:\n${options.style}\n`;
  }

  if (options?.background) {
    prompt += `\nBackground:\n${options.background}\n`;
  }

  prompt += `\nRequirements:\n`;
  prompt += `- The grid must be a SINGLE image with exactly ${config.rows}x${config.cols} equal-sized cells\n`;
  prompt += `- Each cell must have equal width and height\n`;
  prompt += `- Clear visual separation between cells (subtle borders or spacing)\n`;
  prompt += `- Consistent style across all cells\n`;
  prompt += `- All cells must be visible and complete within the image\n`;

  if (options?.extraInstructions) {
    prompt += `\nAdditional instructions:\n${options.extraInstructions}\n`;
  }

  return prompt;
}

export function buildCharacterGridPrompt(
  characterName: string,
  appearance: string,
  outfit: string,
  style: string,
  gridType: GridType = "3x3",
): string {
  if (gridType === "3x3") {
    return buildGridPrompt(
      "3x3",
      `Character: ${characterName}\nAppearance: ${appearance}\nOutfit: ${outfit}`,
      {
        labels: [
          ["Front view", "Side view", "Back view"],
          ["Happy expression", "Angry expression", "Sad expression"],
          ["Surprised expression", "Neutral expression", "Action pose"],
        ],
        style,
        background: "Clean white or transparent background, no distractions",
        extraInstructions:
          `- Each cell shows the full body of the character\n` +
          `- Consistent outfit across all cells\n` +
          `- Character size and position should be consistent across cells\n` +
          `- Only expression, angle, and pose change; appearance and outfit remain identical`,
      },
    );
  }

  return buildGridPrompt(
    "2x2",
    `Character: ${characterName}\nAppearance: ${appearance}\nOutfit: ${outfit}`,
    {
      labels: [
        ["Front view", "Side view"],
        ["Happy expression", "Action pose"],
      ],
      style,
      background: "Clean white or transparent background, no distractions",
      extraInstructions:
        `- Each cell shows the full body of the character\n` +
        `- Consistent outfit across all cells\n` +
        `- Only expression, angle, and pose change; appearance and outfit remain identical`,
    },
  );
}

export function buildSceneGridPrompt(
  sceneName: string,
  sceneDesc: string,
  style: string,
  gridType: GridType = "3x3",
): string {
  if (gridType === "3x3") {
    return buildGridPrompt(
      "3x3",
      `Scene: ${sceneName}\nDescription: ${sceneDesc}`,
      {
        labels: [
          ["Wide shot", "Medium shot", "Close-up detail"],
          ["Day lighting", "Sunset lighting", "Night lighting"],
          ["Sunny weather", "Cloudy atmosphere", "Rainy atmosphere"],
        ],
        style,
        extraInstructions:
          `- Same location/scene in all cells, only lighting, weather, and camera distance change\n` +
          `- Consistent architectural and environmental elements\n` +
          `- Each cell should clearly show the same place under different conditions`,
      },
    );
  }

  return buildGridPrompt(
    "2x2",
    `Scene: ${sceneName}\nDescription: ${sceneDesc}`,
    {
      labels: [
        ["Day view", "Night view"],
        ["Wide shot", "Close-up detail"],
      ],
      style,
      extraInstructions:
        `- Same location/scene in all cells, only lighting and camera distance change\n` +
        `- Consistent architectural and environmental elements`,
    },
  );
}

// ─── Composite Reference Sheet Prompt Builder ───

/**
 * Build a composite reference sheet prompt.
 * Supports flexible layouts: horizontal panels, grid panels, or asymmetric layouts.
 *
 * Layout examples:
 * - horizontal: [character, scene, action] → top/middle/bottom
 * - grid 2x2: 4 characters in a grid
 * - grid 2x3: 6 cells for multiple characters + variations
 * - asymmetric: left 1/3 single panel + right 2/3 as 2x2 grid
 */
export function buildCompositePrompt(
  layout: CompositeLayout,
  style: string,
  options?: {
    title?: string;
    globalRequirements?: string[];
  },
): string {
  let prompt = "";

  if (options?.title) {
    prompt += `# ${options.title}\n\n`;
  }

  prompt += `Create a single composite reference sheet image. `;

  // Describe layout structure
  if (layout.kind === "horizontal") {
    prompt += `The image is divided into ${layout.panels.length} horizontal sections stacked vertically:\n\n`;
    for (let i = 0; i < layout.panels.length; i++) {
      const panel = layout.panels[i]!;
      prompt += `## Section ${i + 1}: ${panel.label}\n`;
      prompt += `Type: ${panel.type}\n`;
      prompt += `Content: ${panel.content}\n\n`;
    }
  } else if (layout.kind === "grid") {
    prompt += `The image is a ${layout.rows}x${layout.cols} grid (${layout.rows * layout.cols} cells total):\n\n`;
    for (let i = 0; i < layout.panels.length; i++) {
      const panel = layout.panels[i]!;
      const row = Math.floor(i / layout.cols) + 1;
      const col = (i % layout.cols) + 1;
      prompt += `## Cell (${row},${col}): ${panel.label}\n`;
      prompt += `Type: ${panel.type}\n`;
      prompt += `Content: ${panel.content}\n\n`;
    }
  } else if (layout.kind === "asymmetric") {
    const leftPct = Math.round(layout.leftRatio * 100);
    const rightPct = 100 - leftPct;
    prompt += `The image is divided asymmetrically: left ${leftPct}% is a single large panel, right ${rightPct}% is a ${layout.right.rows}x${layout.right.cols} grid.\n\n`;

    prompt += `## Left Panel (${leftPct}% width): ${layout.panels[0]?.label || "Main"}\n`;
    prompt += `Type: ${layout.panels[0]?.type || "character"}\n`;
    prompt += `Content: ${layout.panels[0]?.content || ""}\n\n`;

    prompt += `## Right Grid (${layout.right.rows}x${layout.right.cols}):\n`;
    for (let i = 0; i < layout.right.panels.length; i++) {
      const panel = layout.right.panels[i]!;
      const row = Math.floor(i / layout.right.cols) + 1;
      const col = (i % layout.right.cols) + 1;
      prompt += `### Cell (${row},${col}): ${panel.label}\n`;
      prompt += `Type: ${panel.type}\n`;
      prompt += `Content: ${panel.content}\n\n`;
    }
  }

  // Global style
  prompt += `## Global Style\n${style}\n\n`;

  // Global requirements
  prompt += `## Requirements\n`;
  prompt += `- This must be a SINGLE image, not multiple images\n`;
  prompt += `- Clear visual separation between sections/cells\n`;
  prompt += `- Consistent art style across the entire image\n`;
  prompt += `- All content must be fully visible within the image\n`;

  if (options?.globalRequirements) {
    for (const req of options.globalRequirements) {
      prompt += `- ${req}\n`;
    }
  }

  return prompt;
}

/**
 * Build an action decomposition panel prompt.
 * Shows how a character moves with arrow annotations.
 */
export function buildActionDecompositionPrompt(
  characterName: string,
  actionName: string,
  steps: Array<{
    description: string;
    limbMovement?: string; // e.g. "right arm raises upward", "left leg steps forward"
    arrows?: Array<{ from: string; to: string; label?: string }>;
  }>,
  style: string,
  options?: {
    cols?: number; // Number of columns (default: steps.length)
    showArrows?: boolean;
  },
): string {
  const cols = options?.cols || steps.length;
  const rows = Math.ceil(steps.length / cols);

  let prompt = `Create an action decomposition reference sheet for "${characterName}" performing "${actionName}".\n\n`;

  prompt += `Layout: ${rows}x${cols} grid showing sequential movement steps.\n\n`;

  prompt += `## Action Steps\n`;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const row = Math.floor(i / cols) + 1;
    const col = (i % cols) + 1;
    prompt += `### Step ${i + 1} (Row ${row}, Col ${col}): ${step.description}\n`;

    if (step.limbMovement) {
      prompt += `- Limb movement: ${step.limbMovement}\n`;
    }

    if (step.arrows && step.arrows.length > 0) {
      prompt += `- Movement arrows:\n`;
      for (const arrow of step.arrows) {
        prompt += `  * ${arrow.from} → ${arrow.to}${arrow.label ? ` (${arrow.label})` : ""}\n`;
      }
    }
    prompt += `\n`;
  }

  prompt += `## Arrow Annotation Requirements\n`;
  prompt += `- Draw clear directional arrows on each step showing limb movement direction\n`;
  prompt += `- Use curved arrows for rotational movements (e.g. arm swinging)\n`;
  prompt += `- Use straight arrows for linear movements (e.g. stepping forward)\n`;
  prompt += `- Arrow color: contrasting color (red or bright yellow) against the character\n`;
  prompt += `- Arrow thickness: visible but not obscuring the character\n`;
  prompt += `- Number each step clearly (1, 2, 3, ...)\n`;
  prompt += `- Include a "start pose" and "end pose" indicator\n`;

  prompt += `\n## Style\n${style}\n\n`;

  prompt += `## Requirements\n`;
  prompt += `- Single image with ${steps.length} sequential steps\n`;
  prompt += `- Same character appearance across all steps\n`;
  prompt += `- Consistent camera angle (side view recommended for clarity)\n`;
  prompt += `- Clean background (white or light gray)\n`;
  prompt += `- Arrows must clearly show direction of movement\n`;
  prompt += `- Include subtle motion trail effect for fast movements\n`;

  return prompt;
}

/**
 * Pre-built layout: Top character + Middle scene + Bottom action decomposition
 */
export function buildTriplePanelPrompt(
  character: { name: string; appearance: string; outfit: string },
  scene: { name: string; description: string },
  action: { name: string; steps: string[] },
  style: string,
): string {
  const layout: CompositeLayout = {
    kind: "horizontal",
    panels: [
      {
        type: "character",
        label: `Character: ${character.name}`,
        content: `Reference image of ${character.name}. ${character.appearance}. Wearing: ${character.outfit}. Show front view, full body.`,
      },
      {
        type: "scene",
        label: `Scene: ${scene.name}`,
        content: `Scene reference: ${scene.description}. Show the key visual elements and atmosphere.`,
      },
      {
        type: "action",
        label: `Action: ${action.name}`,
        content: `Action decomposition for "${action.name}". ${action.steps.length} steps: ${action.steps.map((s, i) => `${i + 1}. ${s}`).join("; ")}. Draw directional arrows showing limb movement between steps.`,
      },
    ],
  };

  return buildCompositePrompt(layout, style, {
    title: `${character.name} - ${scene.name} - ${action.name} Reference Sheet`,
    globalRequirements: [
      "Top 1/3: Character reference (front view, full body)",
      "Middle 1/3: Scene reference (wide shot, atmosphere)",
      "Bottom 1/3: Action decomposition (sequential steps with arrows)",
      "Each section takes exactly 1/3 of image height",
      "Clear horizontal dividers between sections",
    ],
  });
}

/**
 * Pre-built layout: Multiple characters in 2x2 or 2x3 grid
 */
export function buildMultiCharacterGridPrompt(
  characters: Array<{ name: string; appearance: string; outfit: string; expression?: string }>,
  style: string,
  layout: "2x2" | "2x3" = "2x2",
): string {
  const [rows, cols] = layout === "2x2" ? [2, 2] : [2, 3];

  const panels: Panel[] = characters.map((char) => ({
    type: "character" as PanelType,
    label: char.name,
    content: `${char.name}: ${char.appearance}. Wearing: ${char.outfit}.${char.expression ? ` Expression: ${char.expression}.` : ""} Front view, full body.`,
  }));

  const compositeLayout: CompositeLayout = {
    kind: "grid",
    rows,
    cols,
    panels,
  };

  return buildCompositePrompt(compositeLayout, style, {
    title: `Character Reference Sheet (${layout})`,
    globalRequirements: [
      `Grid layout: ${rows}x${cols}`,
      "Each cell shows one character, front view, full body",
      "Consistent art style and scale across all characters",
      "Clean white background in each cell",
    ],
  });
}

/**
 * Pre-built layout: Asymmetric - Left 1/3 main character + Right 2/3 as 2x2 variations
 */
export function buildAsymmetricCharacterPrompt(
  mainCharacter: { name: string; appearance: string; outfit: string },
  variations: Array<{ label: string; description: string }>,
  style: string,
): string {
  const allPanels: Panel[] = [
    {
      type: "character",
      label: mainCharacter.name,
      content: `${mainCharacter.name}: ${mainCharacter.appearance}. Wearing: ${mainCharacter.outfit}. Front view, full body, detailed.`,
    },
    ...variations.map((v) => ({
      type: "character" as PanelType,
      label: v.label,
      content: v.description,
    })),
  ];

  const layout: CompositeLayout = {
    kind: "asymmetric",
    panels: allPanels,
    leftRatio: 1 / 3,
    right: { rows: 2, cols: 2, panels: allPanels.slice(1) },
  };

  return buildCompositePrompt(layout, style, {
    title: `${mainCharacter.name} Character Reference (Asymmetric)`,
    globalRequirements: [
      "Left 1/3: Large detailed main character reference",
      "Right 2/3: 2x2 grid showing character variations",
      "Same character in all panels, only pose/expression/angle changes",
      "Consistent scale and style across entire image",
    ],
  });
}

// ─── CLI ───

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 3 || args.includes("--help") || args.includes("-h")) {
    console.log(`Usage:
  npx -y bun grid.ts split <input.png> <output_dir> --grid 3x3|2x2 [--prefix name]
  npx -y bun grid.ts panels <input.png> <output_dir> --panels <json> [--prefix name]

Commands:
  split <input> <output_dir>     Split an image into equal grid cells
  panels <input> <output_dir>    Split an image by custom panel regions

Options:
  --grid <type>     Grid type: 3x3 or 2x2 (default: 3x3)
  --panels <json>   Panel definitions as JSON array:
                    [{"name":"top","left":0,"top":0,"width":1,"height":0.33},...]
  --prefix <name>   Prefix for output filenames

Examples:
  # Split 3x3 grid
  npx -y bun grid.ts split character.png ./cells --grid 3x3 --prefix char

  # Split 2x2 grid
  npx -y bun grid.ts split scene.png ./cells --grid 2x2

  # Split by custom panels (top/middle/bottom thirds)
  npx -y bun grid.ts panels composite.png ./panels --prefix ref \
    --panels '[{"name":"character","left":0,"top":0,"width":1,"height":0.33},{"name":"scene","left":0,"top":0.33,"width":1,"height":0.33},{"name":"action","left":0,"top":0.66,"width":1,"height":0.34}]'`);
    process.exit(args.length > 0 && !args.includes("--help") && !args.includes("-h") ? 1 : 0);
  }

  const command = args[0];

  if (command === "split") {
    const inputPath = args[1];
    const outputDir = args[2];

    if (!inputPath || !outputDir) {
      console.error("Error: input and output_dir are required");
      process.exit(1);
    }

    let gridType: GridType = "3x3";
    let prefix: string | undefined;

    for (let i = 3; i < args.length; i++) {
      if (args[i] === "--grid") {
        const v = args[++i];
        if (v !== "3x3" && v !== "2x2") {
          console.error(`Invalid grid type: ${v}. Use 3x3 or 2x2`);
          process.exit(1);
        }
        gridType = v;
      } else if (args[i] === "--prefix") {
        prefix = args[++i];
      }
    }

    try {
      await access(inputPath);
    } catch {
      console.error(`Error: Input file not found: ${inputPath}`);
      process.exit(1);
    }

    console.log(`Splitting ${inputPath} into ${gridType} grid...`);
    const paths = await splitGrid(inputPath, outputDir, gridType, prefix);
    console.log("Output files:");
    for (const p of paths) {
      console.log(`  ${p}`);
    }
    return;
  }

  if (command === "panels") {
    const inputPath = args[1];
    const outputDir = args[2];

    if (!inputPath || !outputDir) {
      console.error("Error: input and output_dir are required");
      process.exit(1);
    }

    let panelsJson: string | undefined;
    let prefix: string | undefined;

    for (let i = 3; i < args.length; i++) {
      if (args[i] === "--panels") {
        panelsJson = args[++i];
      } else if (args[i] === "--prefix") {
        prefix = args[++i];
      }
    }

    if (!panelsJson) {
      console.error("Error: --panels is required for panels command");
      process.exit(1);
    }

    let panels: Array<{ name: string; left: number; top: number; width: number; height: number }>;
    try {
      panels = JSON.parse(panelsJson);
    } catch {
      console.error("Error: Invalid JSON for --panels");
      process.exit(1);
    }

    try {
      await access(inputPath);
    } catch {
      console.error(`Error: Input file not found: ${inputPath}`);
      process.exit(1);
    }

    console.log(`Splitting ${inputPath} into ${panels.length} panels...`);
    const paths = await splitByPanels(inputPath, outputDir, panels, prefix);
    console.log("Output files:");
    for (const p of paths) {
      console.log(`  ${p}`);
    }
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
