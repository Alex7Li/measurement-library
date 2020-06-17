/**
 * @fileoverview Utility functions for the demo app.
 *
 */
import {store} from '../store/store.js';

/**
 * Create a deep copy of the passed in data, which is expected
 * to be shaped like the sample data in store.js.
 * @param {!Object} data The data to copy.
 * @return {!Object} A deep copy of the input.
 */
export function deepCopy(data) {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Type definition for our application's standard item parameters.
 * These are to be sent in the items array found in many gtag events.
 * Acceptable parameters can be [found here](https://developers.google.com/gtagjs/reference/aw-events)
 * @typedef {{item_id: string, item_name: string,
  *     price: string}} ItemParameters
  */

/**
  * Selects an item from the store via ID and returns an object containing
  * its standard item parameters.
  * @param {string} itemId
  * @return {!ItemParameters}
  */
export function getItemParameters(itemId) {
  const /** {ItemStore} */ items = store.getState().items;
  return {
    item_id: itemId,
    item_name: items[itemId].name,
    price: items[itemId].cost,
  };
}

/**
  * Collects all the standard item parameters from the items in the cart
  * and returns them in an array.
  * @return {Array<!ItemParameters>}
  */
export function getItemsArrayFromCart() {
  const /** Array<!ItemParameters> */ itemsArray = [];
  const items = store.getState().items;
  for (const [itemID, item] of Object.entries(items)) {
    if (item.inCart) {
      itemsArray.push({
        ...getItemParameters(itemID),
        quantity: item.quantity,
      });
    }
  }
  return itemsArray;
}
