import * as React from "react";

import { InfoLabel, Loading, TokenIcon } from "@renex/react-components";

import { _catchInteractionErr_ } from "../../lib/errors";
import { Token } from "../../state/generalTypes";
import { Popup } from "./Popup";

export const DepositReceived: React.StatelessComponent<{
    messageID: string | null;
    token?: Token;
    submitDeposit?: () => Promise<void>;
}> = ({ messageID, token, submitDeposit }) => {
    const [submitted, setSubmitted] = React.useState(false);
    const [error, setError] = React.useState(null as Error | null);

    const onClick = async () => {
        setError(null);
        setSubmitted(true);
        if (submitDeposit) {
            try {
                await submitDeposit();
            } catch (error) {
                setSubmitted(false);
                setError(error);
                _catchInteractionErr_(error);
            }
        }
    };

    const waiting = (submitDeposit === undefined) || submitted;

    return <Popup>
        <div className="deposit-address">
            <div className="popup--body">
                {token ? <TokenIcon className="token-icon" token={token} /> : null}
                {waiting ? <Loading /> : null}
                <h2>Submit to darknodes</h2>
                {error ? <span className="red">{`${error.message || error}`}</span> : null}
                {waiting ? <div className="address-input--message">
                    <>Submitting order to RenVM... {messageID ? <InfoLabel>Message ID: {messageID}</InfoLabel> : null}</>
                </div> : <div className="popup--buttons">
                        <button className="button open--confirm" onClick={onClick}>Submit to darknodes</button>
                    </div>
                }
            </div>
        </div>
    </Popup>;
};
