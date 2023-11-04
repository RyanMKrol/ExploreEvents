import fs from 'fs';
import Handlebars from 'handlebars';

const TEMPLATE_FILE_LOC = `${process.cwd()}/template/index.html`;
const OUTPUT_FILE_LOC = `${process.cwd()}/output/index.html`;

/**
 * @param {Array<object>} data Looks like [{artist, venue}, ...]
 */
function createReportFile(data) {
  const source = fs.readFileSync(TEMPLATE_FILE_LOC, 'utf8');

  const template = Handlebars.compile(source);

  const result = template(data);

  fs.writeFileSync(OUTPUT_FILE_LOC, result);
}

export default createReportFile;
