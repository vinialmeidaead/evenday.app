import {t} from "@lingui/macro";
import classes from "./FloatingPoweredBy.module.scss";
import classNames from "classnames";
import React, {useMemo} from "react";
import {iHavePurchasedALicence, isHiEvents} from "../../../utilites/helpers.ts";
import {getConfig} from "../../../utilites/config.ts";

/**
 * (c) Hi.Events Ltd 2025
 *
 * PLEASE NOTE:
 *
 * Hi.Events is licensed under the GNU Affero General Public License (AGPL) version 3.
 *
 * You can find the full license text at: https://github.com/HiEventsDev/hi.events/blob/main/LICENCE
 *
 * In accordance with Section 7(b) of the AGPL, you must retain the "Powered by Hi.Events" notice.
 *
 * If you wish to remove this notice, a commercial license is available at: https://hi.events/licensing
 */
export const PoweredByFooter = (
    props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
) => {
    if (iHavePurchasedALicence()) {
        return <></>;
    }

    const link = useMemo(() => {
        let host = getConfig("VITE_FRONTEND_URL") ?? "unknown";
        let medium = "app";

        if (typeof window !== "undefined" && window.location) {
            host = window.location.hostname;
            medium = window.location.pathname.includes("/widget") ? "widget" : "app";
        }

        const url = new URL("https://evenday.app");


        return url.toString();
    }, []);

    const footerContent = isHiEvents() ? (
        <>
            {t`Planning an event?`}{" "}
            <a
                href={`${link}`}
                target="_blank"
                className={classes.ctaLink}
                title={"Gerencie eventos e venda ingressos online com Evenday"}
            >
                {t`Try Evenday Free`}
            </a>
        </>
    ) : (
        <>
            {t`Powered by`}{" "}
            <a
                href={link}
                target="_blank"
                title={"Gerencie eventos e venda ingressos online com Evenday"}
            >
                Evenday
            </a>{" "}
            🚀
        </>
    );

    return (
        <div {...props} className={classNames(classes.poweredBy, props.className)}>
            <div className={classes.poweredByText}>
                {footerContent}
            </div>
        </div>
    );
}
