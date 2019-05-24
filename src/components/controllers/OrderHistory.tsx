import * as React from "react";

import { TokenIcon } from "@renex/react-components";
import { withTranslation, WithTranslation } from "react-i18next";

import { connect, ConnectedProps } from "../../state/connect";
import { AppContainer } from "../../state/containers";
import { HistoryEvent } from "../../state/containers/appContainer";

import { naturalTime } from "../../lib/conversion";

const OrderHistoryEntry = (props: { order: HistoryEvent }) => {
    return (
        <div className="swap--history--entry">
            <div className="token--info">
                <TokenIcon className="token-icon" token={props.order.dstToken} />
                <span className="received--text">Received</span><span className="token--amount">{props.order.dstAmount.toFixed()} {props.order.dstToken}</span>
            </div>
            <span className="swap--time">{naturalTime(props.order.time, { message: "Just now", suffix: "ago", countDown: false, abbreviate: true })}</span>
        </div>
    );
};

/**
 * OrderHistory is a visual component for allowing users to open new orders
 */
class OrderHistoryClass extends React.Component<Props, {}> {
    /**
     * The main render function.
     * @dev Should have minimal computation, loops and anonymous functions.
     */
    public render(): React.ReactNode {
        const { containers: [appContainer] } = this.props;
        return <>
            <div className="section history">
                <div className="history--banner">
                    <span>History</span>
                </div>
                <div className="history--list">
                    {appContainer.state.swapHistory.map(h => {
                        return <OrderHistoryEntry
                            key={`${h.commitment.refundBlockNumber}--${h.time}`}
                            order={h}
                        />;
                    })}
                </div>
            </div>
        </>;
    }
}

interface Props extends ConnectedProps<[AppContainer]>, WithTranslation {
}

export const OrderHistory = withTranslation()(connect<Props>([AppContainer])(OrderHistoryClass));
