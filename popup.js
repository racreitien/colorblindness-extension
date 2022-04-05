let contrastSwitch = document.getElementById("contrastSwitch");

import { pSBC, contrast } from './contrast.mjs';

// TODO: find elements that have a bad contrast ratio according to WCAG AAA
// 7:1 for text/background
// 4.5:1 for heading or large text/background

// TODO: for each pair, darken the darker color until AAA standard is met
//       and apply the change to the HTML element
