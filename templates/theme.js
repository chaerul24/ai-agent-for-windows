import { THEME } from "../templates/theme.js";

s.background = { fill: THEME.background };

s.addText(slide.title, {
  ...THEME.title,
  color: THEME.titleColor
});

s.addText(slide.points.join("\n"), {
  ...THEME.content,
  color: THEME.textColor
});