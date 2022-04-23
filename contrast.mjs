// take a color and darken in without changing the shade.
// origination: https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
export const pSBC = (percent, from, to, linear_blending) => {
	//from: "before" color, to: "after" color
	//percent: percentage to blend by (numerical value)
	//linear blending: boolean value for if you wish to use linear blending or not
	let r, g, b, P, f, t, hex, m = Math.round, alpha = typeof(to) == "string";
		//r, g, b: RGB colors
		//f, t: from/to values that are specified for the r, g, b colors
		//hex: used for if you're dealing with a hex value
		//m: for shortening the "Math.round" expression
		//alpha: value for the alpha channel - used in linear blending
	if (typeof(percent) != "number" || percent < -1 || percent > 1 || typeof(from) != "string" || (from[0] != 'r' && from[0] != '#') || (to && !alpha)) {
		return null;
	}
	hex = from.length > 9;
	hex = alpha ? to.length > 9 ? true : to == "c" ? !hex : false : hex;
	f = pSBC.pSBCr(from);
	P = percent < 0;
	t = to && to != "c" ? pSBC.pSBCr(to) : P ? {r:0, g:0, b:0, alpha: -1} : {r:255, g:255, b:255, alpha: -1};
	percent = P ? percent *- 1 : percent;
	P = 1 - percent;
	if (!f || !t) { //if there's no 'from' or 'to' values to work with
		return null;
	}
	if (linear_blending) {
		r = m(P * f.r + percent * t.r);
		g = m(P * f.g + percent * t.g);
		b = m(P * f.b + percent * t.b);
	} else {
		r = m((P * f.r ** 2 + percent * t.r ** 2) ** 0.5);
		g = m((P * f.g ** 2 + percent * t.g ** 2) ** 0.5);
		b = m((P * f.b ** 2 + percent * t.b ** 2) ** 0.5);
	}
	alpha = f.alpha;
	t = t.alpha;
	f = alpha >= 0 || t >= 0;
	alpha = f ? alpha < 0 ? t : t < 0 ? alpha : alpha * P + t * percent : 0;
	if (hex) {
		return "rgb" + (f ? "a(" : "(" ) + r + "," + g + "," + b + (f ? "," + m(alpha * 1000)/1000 : "") + ")";
	} else {
		return "#" + (4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(alpha * 255) : 0)).toString(16).slice(1, f ? undefined : -2);
	}
}

// origination: https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
pSBC.pSBCr = (digits) => {
	//digits: what makes up the RGB value
	//r, g, b: RGB colors
	const i = parseInt; //shorthand for parseInt
	let n = digits.length, x = {};
	if (n > 9) {
		const [r, g, b, alpha] = (digits = digits.split(','));
	    n = digits.length;
		if (n<3 || n>4) {
			return null;
		}
		x.r = i(r[3] == "a" ? r.slice(5) : r.slice(4));
		x.g = i(g); 
		x.b = i(b);
		x.alpha = alpha ? parseFloat(alpha):-1;
	} else {
		if (n == 8 || n == 6 || n<4) {
			return null;
		}
		if (n < 6) {
			digits = "#" + digits[1] + digits[1] + digits[2] + digits[2] + digits[3] + digits[3] + (n > 4 ? digits[4] + digits[4] : "");
		}
		digits = i(digits.slice(1), 16);
		if (n == 9 || n == 5) {
			x.r = digits >> 24&255;
			x.g = digits >> 16&255;
			x.b = digits >> 8&255;
			x.alpha = Math.round((digits & 255)/0.255)/1000;
		} else {
			x.r = digits >> 16;
			x.g = digits >> 8&255; 
			x.b = digits & 255; 
			x.alpha = -1;
		}
	} return x
};

// gets the background color of a DOM element
// origination: https://stackoverflow.com/questions/12576084/getting-the-real-background-color-of-an-element
export function realBackgroundColor(elem) {
    var transparent = 'rgba(0, 0, 0, 0)';
    var transparentIE11 = 'transparent';
    if (!elem) return transparent;

    var bg = getComputedStyle(elem).backgroundColor;
    if (bg === transparent || bg === transparentIE11) {
        return realBackgroundColor(elem.parentElement);
    } else {
        return bg;
    }
}

// turns an rgb string in format rgb(0, 0, 0) to an array [0, 0, 0]
export function makeArrayRGB(rgb) {
	let colorArr = rgb.slice(
		rgb.indexOf("(") + 1, 
		rgb.indexOf(")")
	).split(", ");

	return colorArr;
}  

// calculates the contrast of two colors
// origination: https://github.com/LeaVerou/contrast-ratio/tree/d402291022c882c9ae5547b755afa9976460374c
function luminance(r, g, b) {
	//r, g, b: RGB colors
    var a = [r, g, b].map(function (v) {
        v /= 255;
        return v <= 0.03928
            ? v / 12.92
            : Math.pow( (v + 0.055) / 1.055, 2.4 );
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// origination: https://github.com/LeaVerou/contrast-ratio/tree/d402291022c882c9ae5547b755afa9976460374c
// calculate beginnning contrast
export function getContrast(rgb1, rgb2) {
    var lum1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
    var lum2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
    var brightest = Math.max(lum1, lum2);
    var darkest = Math.min(lum1, lum2);
    return (brightest + 0.05)
         / (darkest + 0.05);
}

// returns the minimum contrast ratio that satisfies WCAG AAA according to type of text
export function minContrast(element) {
	// define large text --> at least 18 pt regular font or 14 pt bold font
	let fontWeight = getComputedStyle(element).fontWeight;
	let largeFont = (Number(fontWeight) > 400 || fontWeight === "bold") ? 14 : 18;

	if (element.nodeName.startsWith("H") || element.style.fontSize >= largeFont) {
		return 4.5;
	}
	
	return 7;  // normal text
}

// TODO: add function that darkens a color to meet a certain ratio against a second color
export function darken(darker, lighter, contrast) { //pass in element instead of contrast?
	//call pSBC here until you reach the getContrast parameter in a while loop
	while (getcontrast(darker, lighter) < minContrast(contrast)){
		lighter = pSBC (0.25, light); // 25% Lighter
		darker = pSBC (0.25, darker); // 25% Darker
	}
	return darker;
}
