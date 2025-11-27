import {t} from '@lingui/macro';
import {IconCalendarPlus} from '@tabler/icons-react';
import {GenericErrorPage} from "../../../common/GenericErrorPage";

export const OrganizerNotFound = () => {
    return (
        <GenericErrorPage
            title={t`Organizador não encontrado`}
            description={t`O organizador que você está procurando não foi encontrado. A página pode ter sido movida, excluída ou a URL pode estar incorreta.`}
            pageTitle={t`Organizador não encontrado`}
            metaDescription={t`O organizador que você está procurando não foi encontrado. A página pode ter sido movida, excluída ou a URL pode estar incorreta.`}
            buttonText={t`Criar seu próprio evento`}
            buttonUrl="https://plataforma.evenday.app"
            buttonIcon={<IconCalendarPlus size={18}/>}
        >

        </GenericErrorPage>
    );
};

export default OrganizerNotFound;
