export async function parseHeader(headerStr) {
  if (!headerStr) return undefined;

  let lines = headerStr.split("\n");
  let mainObj = lines[0].split("/");

  let subcomponents = new Map();
  for (let i=1; i<lines.length; i++) {
    let trimmedLine = lines[i].trim();

    if (!trimmedLine || trimmedLine.length == 0) {
      continue;
    }

    let [label, subcomponent] = trimmedLine.split(":");
    subcomponents.set(label, subcomponent.split("/"));
  }

  for (let i=0; i<mainObj.length; i++) {
    let subcomponent = subcomponents.get(mainObj[i]);
    if (subcomponent) {
      mainObj[i] = {label: mainObj[i], data: subcomponent};
    }
  }

  return mainObj;
}
