import * as SAX from 'sax';

import { JsApi, Options } from './jsapi';

const saxOptions: SAX.SAXOptions = {
  trim: false,
  normalize: true,
  lowercase: true,
  xmlns: true,
  position: true,
};

const allowedRoots = new Set(['vector', 'animated-vector']);
export const MAX_XML_DEPTH = 256;
export const MAX_XML_NODES = 100000;

/**
 * @param {String} data input data
 * @param {Function} callback
 */
export function xml2js(
  data: string,
  onSuccess: (jsApi: JsApi) => void,
  onFail: (error: string) => void,
) {
  const sax = SAX.parser(true, saxOptions);
  const root = new JsApi({ elem: '#document', content: [] });
  let current: JsApi = root;
  const stack = [root];
  let parsingError = false;
  let documentElement: string;
  let nodeCount = 0;

  function pushToContent(options: Options) {
    const newContent = new JsApi({ parentNode: current, ...options });
    (current.content = current.content || []).push(newContent);
    return newContent;
  }

  sax.onopentag = function(node) {
    const qualifiedTag = node as SAX.QualifiedTag;
    const localName = qualifiedTag.local || qualifiedTag.name;
    if (!documentElement) {
      if (!allowedRoots.has(localName)) {
        throw new Error('Expected a VectorDrawable or AnimatedVectorDrawable root element.');
      }
      documentElement = localName;
    }
    if (stack.length > MAX_XML_DEPTH) {
      throw new Error(`XML nesting exceeds the limit of ${MAX_XML_DEPTH}.`);
    }
    nodeCount++;
    if (nodeCount > MAX_XML_NODES) {
      throw new Error(`XML element count exceeds the limit of ${MAX_XML_NODES}.`);
    }
    const elem = {
      elem: qualifiedTag.name,
      prefix: qualifiedTag.prefix,
      local: qualifiedTag.local,
      attrs: {} as any,
    };
    for (const name of Object.keys(qualifiedTag.attributes)) {
      const { value, prefix, local } = qualifiedTag.attributes[name];
      elem.attrs[name] = { name, value, prefix, local };
    }
    const jsApiElem = pushToContent(elem);
    current = jsApiElem;
    stack.push(jsApiElem);
  };

  sax.onclosetag = function() {
    stack.pop();
    current = stack[stack.length - 1];
  };

  sax.oncomment = function(comment) {
    pushToContent({ comment: { text: comment.trim() } });
  };

  sax.onprocessinginstruction = function(processingInstruction) {
    pushToContent({ processingInstruction });
  };

  sax.ondoctype = function() {
    throw new Error('DOCTYPE is not allowed.');
  };

  sax.ontext = function(text) {
    if (text.trim()) throw new Error('Text content is not supported in vector drawables.');
  };

  sax.oncdata = function(text) {
    if (text.trim()) throw new Error('CDATA is not supported in vector drawables.');
  };

  sax.onerror = function(error) {
    error.message = 'Error in parsing XML: ' + error.message;
    if (error.message.indexOf('Unexpected end') < 0) {
      throw error;
    }
  };

  sax.onend = function() {
    if (this.error) {
      onFail(this.error.message);
    } else if (!documentElement) {
      onFail('Expected a VectorDrawable or AnimatedVectorDrawable root element.');
    } else {
      onSuccess(root);
    }
  };

  try {
    sax.write(data);
  } catch (e) {
    onFail(e.message);
    parsingError = true;
  }
  if (!parsingError) {
    sax.close();
  }
}
