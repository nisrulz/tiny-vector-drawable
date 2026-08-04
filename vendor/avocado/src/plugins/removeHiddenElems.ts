import { JsApi } from '../lib/jsapi';
import { Plugin } from './_types';
import { path2js } from './_path';

/**
 * Remove hidden elements.
 */
function fn(item: JsApi) {
  if (!item.isElem()) {
    return item;
  }

  if (item.isElem('path') || item.isElem('clip-path')) {
    const pathData = item.attr('android:pathData');
    if (!pathData || !pathData.value.trim()) {
      if (item.hasAttr('android:name')) throw new Error('Missing android:pathData.');
      return undefined;
    }
    const commands = path2js(item);
    const drawsAnything = commands.some(
      command => command.instruction.toLowerCase() !== 'm' && command.instruction !== 'z',
    );
    if (!drawsAnything && !item.hasAttr('android:name')) return undefined;
  }

  return item;
}

export const removeHiddenElems: Plugin<undefined> = {
  type: 'perItem',
  active: true,
  description: 'removes hidden elements',
  params: undefined,
  fn,
};
