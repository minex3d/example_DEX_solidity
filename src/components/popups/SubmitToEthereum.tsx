import * as React from "react";

import { _catchInteractionErr_ } from "../../lib/errors";
import { Token } from "../../state/generalTypes";
import { Popup } from "./Popup";

export const SubmitToEthereum: React.StatelessComponent<{
    token: Token,
    submit: () => Promise<void>,
}> = ({ token, submit }) => {
    const [ submitting, setSubmitting] = React.useState(false);
    const onSubmit = () => {
        setSubmitting(true);
        submit().catch(_catchInteractionErr_);
    };
    return <Popup>
        <div className="address-input">
            <div className="popup--body">
                <h2>Submit swap to Ethereum</h2>
                <div className="address-input--message">
                    Submit swap to Ethereum to receive {token.toUpperCase()}.
                    <br />
                    <br />
                </div>
                <div className="popup--buttons">
                    <button className="button open--confirm" disabled={submitting} onClick={onSubmit}>Submit</button>
                </div>
            </div>
        </div>
    </Popup>;
};
