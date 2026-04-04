import {
    Alert,
    Button,
    Checkbox,
    PasswordInput,
    Select,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import {hasLength, isEmail, isNotEmpty, matchesField, useForm} from "@mantine/form";
import {RegisterAccountRequest} from "../../../../types.ts";
import {useFormErrorResponseHandler} from "../../../../hooks/useFormErrorResponseHandler.tsx";
import {useRegisterAccount} from "../../../../mutations/useRegisterAccount.ts";
import {NavLink, useLocation, useNavigate} from "react-router";
import classes from "./Register.module.scss";
import {getClientLocale} from "../../../../locales.ts";
import {useEffect} from "react";
import {getConfig} from "../../../../utilites/config.ts";

const PIX_KEY_OPTIONS = [
    {value: "CPF", label: "CPF"},
    {value: "CNPJ", label: "CNPJ"},
    {value: "EMAIL", label: "E-mail"},
    {value: "PHONE", label: "Telefone"},
    {value: "EVP", label: "Chave aleatória"},
];

const DOC_TYPE_OPTIONS = [
    {value: "CPF", label: "CPF"},
    {value: "CNPJ", label: "CNPJ"},
];

export const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const form = useForm({
        validateInputOnBlur: true,
        initialValues: {
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            organizer_tax_id_type: "CPF" as "CPF" | "CNPJ",
            organizer_tax_id: "",
            instagram: "",
            pix_key_type: "EMAIL",
            pix_key_value: "",
            location_details: {
                zip_or_postal_code: "",
                address_line_1: "",
                address_line_2: "",
                city: "",
                state_or_region: "",
                country: "BR",
                venue_name: "",
            },
            password: "",
            password_confirmation: "",
            declaration_accepted: false,
            timezone: typeof window !== "undefined"
                ? Intl.DateTimeFormat().resolvedOptions().timeZone
                : "UTC",
            locale: getClientLocale(),
            invite_token: "",
            currency_code: "BRL",
        },
        validate: {
            first_name: isNotEmpty("Informe o primeiro nome."),
            last_name: isNotEmpty("Informe o sobrenome."),
            password: hasLength({min: 8}, "A senha deve ter pelo menos 8 caracteres."),
            password_confirmation: matchesField("password", "As senhas não coincidem."),
            email: isEmail("Verifique se o e-mail é válido."),
            phone: isNotEmpty("Informe o WhatsApp."),
            organizer_tax_id: (value, values) => {
                const digits = value.replace(/\D/g, "");
                if (values.organizer_tax_id_type === "CPF" && digits.length !== 11) {
                    return "CPF deve ter 11 dígitos.";
                }
                if (values.organizer_tax_id_type === "CNPJ" && digits.length !== 14) {
                    return "CNPJ deve ter 14 dígitos.";
                }
                if (digits.length === 0) {
                    return "Informe o CPF ou CNPJ.";
                }
                return null;
            },
            instagram: isNotEmpty("Informe o Instagram."),
            pix_key_type: isNotEmpty("Selecione o tipo de chave PIX."),
            pix_key_value: isNotEmpty("Informe a chave PIX."),
            "location_details.zip_or_postal_code": isNotEmpty("Informe o CEP."),
            "location_details.address_line_1": isNotEmpty("Informe o endereço."),
            "location_details.city": isNotEmpty("Informe a cidade."),
            "location_details.state_or_region": isNotEmpty("Informe o estado."),
            "location_details.country": isNotEmpty("Informe o país."),
            declaration_accepted: (v) =>
                v ? null : "Você precisa aceitar a declaração para continuar.",
        },
    });

    const errorHandler = useFormErrorResponseHandler();
    const mutate = useRegisterAccount();

    const registerUser = (data: RegisterAccountRequest) => {
        const digitsTax = data.organizer_tax_id.replace(/\D/g, "");
        const payload: RegisterAccountRequest = {
            ...data,
            organizer_tax_id: digitsTax,
            instagram: data.instagram.trim().replace(/^@/, ""),
        };
        mutate.mutate(
            {registerData: payload},
            {
                onSuccess: () => {
                    navigate("/welcome");
                },
                onError: (error: any) => {
                    errorHandler(form, error, error.response?.data?.message);
                },
            }
        );
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get("invite_token");

        if (token) {
            form.setFieldValue("invite_token", token);
        }
    }, [location.search]);

    const declarationText =
        "Declaro que as informações fornecidas são verdadeiras e que sou responsável pela organização dos eventos cadastrados. Estou ciente de que a plataforma poderá realizar verificação de identidade e análise de segurança. Em caso de inconsistências, indícios de fraude ou violação das políticas da plataforma, a conta ou os eventos poderão ser suspensos, bloqueados ou removidos para proteção dos usuários e da integridade da plataforma.";

    return (
        <>
            <header className={classes.header}>
                <h2>Bem-vindo ao {getConfig("VITE_APP_NAME", "Evenday")} 👋</h2>
                <p>
                    Crie uma conta ou{" "}
                    <NavLink to={"/auth/login"}>fazer login</NavLink> para começar.
                </p>
            </header>

            <div className={classes.registerCard}>
                <form
                    onSubmit={form.onSubmit((values) =>
                        registerUser(values as unknown as RegisterAccountRequest)
                    )}
                >
                    <Stack gap="md">
                        <Alert color="gray" variant="light">
                            Para proteger organizadores e compradores, registros de acesso e atividades na
                            plataforma podem ser monitorados e preservados conforme os protocolos de segurança.
                        </Alert>

                        <SimpleGrid verticalSpacing={0} cols={{base: 1, sm: 2}}>
                            <TextInput
                                {...form.getInputProps("first_name")}
                                label="Primeiro nome"
                                placeholder="João"
                                required
                            />
                            <TextInput
                                {...form.getInputProps("last_name")}
                                label="Sobrenome"
                                placeholder="Silva"
                                required
                            />
                        </SimpleGrid>

                        <TextInput
                            {...form.getInputProps("email")}
                            label="E-mail"
                            placeholder="contato@evenday.app"
                            required
                        />

                        <TextInput
                            {...form.getInputProps("phone")}
                            label="WhatsApp"
                            placeholder="(11) 98765-4321"
                            required
                            description="DDD + número com WhatsApp"
                        />

                        <SimpleGrid verticalSpacing={0} cols={{base: 1, sm: 2}}>
                            <Select
                                {...form.getInputProps("organizer_tax_id_type")}
                                label="Documento do organizador"
                                data={DOC_TYPE_OPTIONS}
                                required
                            />
                            <TextInput
                                {...form.getInputProps("organizer_tax_id")}
                                label={form.values.organizer_tax_id_type === "CNPJ" ? "CNPJ" : "CPF"}
                                placeholder={
                                    form.values.organizer_tax_id_type === "CNPJ"
                                        ? "00.000.000/0000-00"
                                        : "000.000.000-00"
                                }
                                required
                            />
                        </SimpleGrid>

                        <TextInput
                            {...form.getInputProps("instagram")}
                            label="Instagram do evento ou organizador"
                            placeholder="@seu_perfil ou seu_perfil"
                            required
                        />

                        <SimpleGrid verticalSpacing={0} cols={{base: 1, sm: 2}}>
                            <Select
                                {...form.getInputProps("pix_key_type")}
                                label="Tipo de chave PIX"
                                data={PIX_KEY_OPTIONS}
                                required
                            />
                            <TextInput
                                {...form.getInputProps("pix_key_value")}
                                label="Valor da chave PIX"
                                placeholder="Digite a chave conforme o tipo selecionado"
                                required
                            />
                        </SimpleGrid>

                        <div>
                            <Text size="sm" fw={500} mb={6}>
                                Endereço para nota fiscal
                            </Text>
                            <Stack gap="sm">
                                <SimpleGrid cols={{base: 1, sm: 2}}>
                                    <TextInput
                                        {...form.getInputProps("location_details.zip_or_postal_code")}
                                        label="CEP"
                                        placeholder="00000-000"
                                        required
                                    />
                                    <TextInput
                                        {...form.getInputProps("location_details.country")}
                                        label="País (código)"
                                        placeholder="BR"
                                        required
                                        maxLength={2}
                                    />
                                </SimpleGrid>
                                <TextInput
                                    {...form.getInputProps("location_details.address_line_1")}
                                    label="Endereço (logradouro e número)"
                                    placeholder="Rua, número"
                                    required
                                />
                                <TextInput
                                    {...form.getInputProps("location_details.address_line_2")}
                                    label="Complemento"
                                    placeholder="Apto, bloco (opcional)"
                                />
                                <SimpleGrid cols={{base: 1, sm: 2}}>
                                    <TextInput
                                        {...form.getInputProps("location_details.city")}
                                        label="Cidade"
                                        required
                                    />
                                    <TextInput
                                        {...form.getInputProps("location_details.state_or_region")}
                                        label="Estado (UF ou nome)"
                                        placeholder="SP"
                                        required
                                    />
                                </SimpleGrid>
                                <TextInput
                                    {...form.getInputProps("location_details.venue_name")}
                                    label="Nome do local / empresa (opcional)"
                                />
                            </Stack>
                        </div>

                        <SimpleGrid verticalSpacing={0} cols={{base: 1, sm: 2}}>
                            <PasswordInput
                                {...form.getInputProps("password")}
                                label="Senha"
                                placeholder="Sua senha"
                                required
                            />
                            <PasswordInput
                                {...form.getInputProps("password_confirmation")}
                                label="Confirmar senha"
                                placeholder="Confirmar senha"
                                required
                            />
                        </SimpleGrid>

                        <Checkbox
                            {...form.getInputProps("declaration_accepted", {type: "checkbox"})}
                            label={declarationText}
                        />

                        <TextInput
                            style={{display: "none"}}
                            {...form.getInputProps("timezone")}
                            type="hidden"
                        />

                        <Button color={"var(--hi-pink)"} type="submit" fullWidth disabled={mutate.isPending}>
                            {mutate.isPending ? "Criando conta…" : "Criar conta"}
                        </Button>
                    </Stack>
                </form>
                <footer>
                    <p>
                        Ao se registrar, você concorda com nossos{" "}
                        <NavLink
                            target={"_blank"}
                            to={
                                getConfig(
                                    "VITE_TOS_URL",
                                    "https://evenday.app/termos-de-servico"
                                ) as string
                            }
                        >
                            Termos de Uso
                        </NavLink>{" "}
                        e com nossa{" "}
                        <NavLink
                            target={"_blank"}
                            to={
                                getConfig(
                                    "VITE_PRIVACY_URL",
                                    "https://evenday.app/politica-de-privacidade"
                                ) as string
                            }
                        >
                            Política de Privacidade
                        </NavLink>
                        .
                    </p>
                </footer>
            </div>
        </>
    );
};

export default Register;
