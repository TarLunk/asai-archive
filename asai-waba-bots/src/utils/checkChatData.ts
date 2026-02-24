import { parsePhoneNumber } from 'libphonenumber-js'
type checkChatDataType = {
    success: boolean,
    value: string
}
const name = (text: string): checkChatDataType => {
    let success = false;
    let value = '';
    const nameRegex = /^[\p{Letter}\s\-.']+$/u;
    if (nameRegex.test(text)) {
        value = text.split(/(\s|-)/).map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join('');
        success = true;
    }
    return { success, value };
}
const email = (text: string): checkChatDataType => {
    let success = false;
    let value = '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailRegex.test(text)) {
        value = text.toLocaleLowerCase()
        success = true;
    }
    return { success, value };
}
const phone = (text: string): checkChatDataType => {
    let success = false;
    let value = '';
    try {
        const phoneNumber = parsePhoneNumber(text, 'RU');
        if (phoneNumber && phoneNumber.isPossible()) {
            success = true;
            value = phoneNumber.format("INTERNATIONAL");
        }
        return { success, value };
    } catch (err) {
        console.log(err)
        return { success: false, value: text };
    }



}
export const checkChatData = {
    name,
    email,
    phone,
};
