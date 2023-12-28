import {isEmptyStr} from '@/util/util'

export function countWordSyllables(word) {
    if (isEmptyStr(word)) {
        return 0
    }
    word = word.toLowerCase()
    if (word.length <= 3) {
        return 1
    }
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    word = word.replace(/^y/, '')
    return word.match(/[aeiouy]{1,2}/g).length
}

export function countSectionSyllables(section) {
    if (isEmptyStr(section)) {
        return 0
    }

    let sum = 0
    let lines = section.replace(/[^\n]/g, '')
    let symbols = section.match(/\p{P}/ug)
    console.log('symbols:')
    console.log(symbols)
    sum += lines.length * 2
    if (symbols) {
        sum += symbols.length;
    }
    let chineseSection = section.replace(/[^\u4E00-\u9FA5\n]/g, '')
    console.log('chineseSection')
    console.log(chineseSection)
    let chineseSectionCount = 0
    if (chineseSection) {
        chineseSectionCount = chineseSection.length * 2;
    }
    let englishSection = section.replace(/[^a-zA-Z\s]/g, ' ').replace(/\s+/g, ' ')
    console.log('englishSection')
    console.log(englishSection)
    let englishSectionCount = 0
    if (englishSection) {
        let words = englishSection.split(' ');
        for (let i = 0; i < words.length; i++) {
            englishSectionCount += countWordSyllables(words[i]) * 2
        }
    }
    let numberSection = section.replace(/[^\d]/g, ' ').replace(/\s+/g, ' ')
    console.log('numberSection')
    console.log(numberSection)
    let numberSectionCount = 0
    if (!isEmptyStr(numberSection)) {
        for (let number in numberSection.split(' ')) {
            numberSectionCount += number.toString().length + 2
        }
    }
    sum = chineseSectionCount + englishSectionCount + numberSectionCount

    console.log('sum ' + sum)
    console.log('chineseSection:' + chineseSectionCount);
    console.log(chineseSection)
    console.log('englishSection:' + englishSectionCount)
    console.log(englishSection)
    console.log('numberSection:' + numberSection)
    console.log(numberSection)

    return sum
}

export function getStrCount(content, regExp) {
    if (isEmptyStr(content) || isEmptyStr(regExp)) {
        return 0
    }

    let length = content.split(regExp).length;
    return length === 2 ? 1 : length - 1;
}