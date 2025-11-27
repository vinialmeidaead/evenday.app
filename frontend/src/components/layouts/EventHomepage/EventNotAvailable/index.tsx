import {t} from '@lingui/macro';
import {IconCalendarPlus} from '@tabler/icons-react';
import {GenericErrorPage} from "../../../common/GenericErrorPage";
import {isHiEvents} from "../../../../utilites/helpers.ts";

export const EventNotAvailable = () => {
    return (
        <GenericErrorPage
            title={t`Evento não disponível`}
            description={t`O evento que você está procurando não está disponível no momento. Ele pode ter sido removido, expirado ou a URL pode estar incorreta.`}
            pageTitle={t`Evento não disponível`}
            metaDescription={t`O evento que você está procurando não está disponível no momento. Ele pode ter sido removido, expirado ou a URL pode estar incorreta.`}
            buttonText={isHiEvents() ? t`Criar seu próprio evento` : undefined}
            buttonUrl={isHiEvents() ? "https://plataforma.evenday.app" : undefined}
            buttonIcon={<IconCalendarPlus size={18}/>}
        />
    );
};

export default EventNotAvailable;
