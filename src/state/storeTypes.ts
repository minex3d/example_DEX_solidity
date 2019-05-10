import { Currency } from "@renex/react-components";

import { Token, TokenPrices, UITheme } from "../store/types/general";

export interface ApplicationData {
    order: OrderInput;
    tokenPrices: TokenPrices;
    popup: PopupData;
}

export interface OrderInput {
    sendToken: Token;
    receiveToken: Token;
    sendVolume: string;
    receiveVolume: string;
}

export interface OptionsData {
    language: string;
    preferredCurrency: Currency;
    theme: UITheme;
}

export interface PopupData {
    dismissible: boolean;
    onCancel: () => void;
    popup: JSX.Element | null;
    overlay: boolean;
}
