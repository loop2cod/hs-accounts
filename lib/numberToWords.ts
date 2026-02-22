export function numberToWords(num: number): string {
    if (num === 0) return "Zero Rupees Only";
    const a = [
        "",
        "One ",
        "Two ",
        "Three ",
        "Four ",
        "Five ",
        "Six ",
        "Seven ",
        "Eight ",
        "Nine ",
        "Ten ",
        "Eleven ",
        "Twelve ",
        "Thirteen ",
        "Fourteen ",
        "Fifteen ",
        "Sixteen ",
        "Seventeen ",
        "Eighteen ",
        "Nineteen ",
    ];
    const b = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
    ];

    const inWords = (n: number): string => {
        let str = "";
        if (n > 99) {
            str += a[Math.floor(n / 100)] + "Hundred ";
            n = n % 100;
        }
        if (n > 19) {
            str += b[Math.floor(n / 10)] + " ";
            n = n % 10;
        }
        if (n > 0) {
            str += a[n];
        }
        return str;
    };

    const wholeNum = Math.floor(Math.abs(num));
    let words = "";

    if (wholeNum > 9999999) {
        words += inWords(Math.floor(wholeNum / 10000000)) + "Crore ";
        num %= 10000000;
    }
    if (wholeNum > 99999) {
        words += inWords(Math.floor((wholeNum % 10000000) / 100000)) + "Lakh ";
    }
    if (wholeNum > 999) {
        words += inWords(Math.floor((wholeNum % 100000) / 1000)) + "Thousand ";
    }

    words += inWords(wholeNum % 1000);

    let finalString = words.trim() + " Rupees Only";
    // Capitalize first letter
    finalString = finalString.charAt(0).toUpperCase() + finalString.slice(1);
    return finalString;
}
