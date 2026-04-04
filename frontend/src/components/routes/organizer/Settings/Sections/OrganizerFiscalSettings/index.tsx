import {Alert, Button, Select, SimpleGrid, Stack, Text, TextInput} from "@mantine/core";
import {useForm} from "@mantine/form";
import {t} from "@lingui/macro";
import {useEffect} from "react";
import {IconFileInvoice} from "@tabler/icons-react";
import {Card} from "../../../../../common/Card";
import {HeadingWithDescription} from "../../../../../common/Card/CardHeading";
import {useGetAccount} from "../../../../../../queries/useGetAccount.ts";
import {useUpdateAccount} from "../../../../../../mutations/useUpdateAccount.ts";
import {useFormErrorResponseHandler} from "../../../../../../hooks/useFormErrorResponseHandler.tsx";
import {showSuccess} from "../../../../../../utilites/notifications.tsx";
import {useIsCurrentUserAdmin} from "../../../../../../hooks/useIsCurrentUserAdmin.ts";
import type {Account} from "../../../../../../types.ts";

const PIX_OPTIONS = [
    {value: "CPF", label: "CPF"},
    {value: "CNPJ", label: "CNPJ"},
    {value: "EMAIL", label: "E-mail"},
    {value: "PHONE", label: "Telefone"},
    {value: "EVP", label: "Chave aleatória"},
];

const DOC_OPTIONS = [
    {value: "CPF", label: "CPF"},
    {value: "CNPJ", label: "CNPJ"},
];

export const OrganizerFiscalSettings = () => {
    const accountQuery = useGetAccount();
    const account = accountQuery.data;
    const updateMutation = useUpdateAccount();
    const formErrorHandler = useFormErrorResponseHandler();
    const isAdmin = useIsCurrentUserAdmin();

    const form = useForm({
        initialValues: {
            organizer_tax_id_type: "CPF" as "CPF" | "CNPJ",
            organizer_tax_id: "",
            pix_key_type: "EMAIL",
            pix_key_value: "",
        },
    });

    useEffect(() => {
        if (!account) {
            return;
        }
        form.setValues({
            organizer_tax_id_type: (account.organizer_tax_id_type as "CPF" | "CNPJ") || "CPF",
            organizer_tax_id: account.organizer_tax_id || "",
            pix_key_type: account.pix_key_type || "EMAIL",
            pix_key_value: account.pix_key_value || "",
        });
    }, [account?.id, account?.organizer_tax_id, account?.pix_key_value, account?.pix_key_type]);

    const buildPayload = (values: typeof form.values): Account => {
        const digits = values.organizer_tax_id.replace(/\D/g, "");
        return {
            id: account?.id,
            name: account!.name,
            email: account!.email,
            timezone: account!.timezone,
            currency_code: account!.currency_code,
            stripe_platform: account?.stripe_platform ?? "",
            configuration: account?.configuration,
            is_saas_mode_enabled: account?.is_saas_mode_enabled,
            is_account_email_confirmed: account?.is_account_email_confirmed,
            requires_manual_verification: account?.requires_manual_verification,
            organizer_tax_id_type: values.organizer_tax_id_type,
            organizer_tax_id: digits || null,
            pix_key_type: values.pix_key_type,
            pix_key_value: values.pix_key_value.trim(),
        } as Account;
    };

    const handleSubmit = (values: typeof form.values) => {
        if (!account) {
            return;
        }
        updateMutation.mutate(
            {accountData: buildPayload(values)},
            {
                onSuccess: () => {
                    showSuccess(t`Dados salvos`);
                },
                onError: (error: unknown) => {
                    formErrorHandler(form, error as any);
                },
            }
        );
    };

    const acceptedAt = account?.registration_declaration_accepted_at;

    return (
        <Card>
            <HeadingWithDescription
                heading={t`CPF/CNPJ e PIX da conta`}
                description={t`Estes dados são da sua conta (mesmos do cadastro). O WhatsApp do organizador fica em Informações básicas; Instagram e endereço em Redes sociais e Endereço.`}
            />

            <Alert variant="light" color="gray" mb="md" icon={<IconFileInvoice size={18}/>}>
                {t`Alterações aqui aplicam-se a toda a conta. Apenas administradores podem editar.`}
            </Alert>

            {!accountQuery.isLoading && account && (
                <>
                    {acceptedAt && (
                        <Text size="sm" c="dimmed" mb="md">
                            {t`Declaração do cadastro aceita em`}{" "}
                            {new Date(acceptedAt).toLocaleString("pt-BR")}
                        </Text>
                    )}

                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <fieldset disabled={updateMutation.isPending || !isAdmin}>
                            <Stack gap="md">
                                <SimpleGrid cols={{base: 1, sm: 2}}>
                                    <Select
                                        {...form.getInputProps("organizer_tax_id_type")}
                                        label={t`Tipo de documento`}
                                        data={DOC_OPTIONS}
                                        required
                                    />
                                    <TextInput
                                        {...form.getInputProps("organizer_tax_id")}
                                        label={
                                            form.values.organizer_tax_id_type === "CNPJ"
                                                ? t`CNPJ`
                                                : t`CPF`
                                        }
                                        placeholder={
                                            form.values.organizer_tax_id_type === "CNPJ"
                                                ? "00.000.000/0000-00"
                                                : "000.000.000-00"
                                        }
                                        required
                                    />
                                </SimpleGrid>
                                <SimpleGrid cols={{base: 1, sm: 2}}>
                                    <Select
                                        {...form.getInputProps("pix_key_type")}
                                        label={t`Tipo de chave PIX`}
                                        data={PIX_OPTIONS}
                                        required
                                    />
                                    <TextInput
                                        {...form.getInputProps("pix_key_value")}
                                        label={t`Chave PIX`}
                                        required
                                    />
                                </SimpleGrid>
                                {isAdmin ? (
                                    <Button type="submit" loading={updateMutation.isPending}>
                                        {t`Save`}
                                    </Button>
                                ) : (
                                    <Text size="sm" c="dimmed">
                                        {t`Somente administradores da conta podem alterar estes dados.`}
                                    </Text>
                                )}
                            </Stack>
                        </fieldset>
                    </form>
                </>
            )}
        </Card>
    );
};
