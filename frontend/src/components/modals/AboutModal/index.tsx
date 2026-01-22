import {Modal} from "../../common/Modal";
import {GenericModalProps} from "../../../types.ts";
import classes from "./AboutModal.module.scss";
import {Text, Title, Stack, Group, Button} from "@mantine/core";
import {IconBrandWhatsapp, IconMail, IconTicket, IconCalendar, IconUsers, IconCreditCard} from "@tabler/icons-react";

export const AboutModal = ({onClose}: GenericModalProps) => {
    return (
        <Modal onClose={onClose} opened heading="Sobre e Suporte">
            <div className={classes.aboutContainer}>
                <Stack gap="lg">
                    <div>
                        <Title order={2} mb="md">Bem-vindo à Evenday! 🚀</Title>
                        <Text size="md" mb="md">
                            A plataforma completa para gerenciar seus eventos e vender ingressos online de forma simples, 
                            rápida e profissional.
                        </Text>
                    </div>

                    <div>
                        <Title order={3} mb="md">Por que escolher a Evenday?</Title>
                        <Stack gap="md">
                            <Group gap="sm" align="flex-start">
                                <IconCalendar size={24} color="var(--mantine-color-blue-6)" />
                                <div>
                                    <Text fw={600} size="sm" mb={4}>Gestão Completa de Eventos</Text>
                                    <Text size="sm" c="dimmed">
                                        Crie, gerencie e promova seus eventos com ferramentas profissionais e intuitivas.
                                    </Text>
                                </div>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <IconTicket size={24} color="var(--mantine-color-green-6)" />
                                <div>
                                    <Text fw={600} size="sm" mb={4}>Venda de Ingressos Online</Text>
                                    <Text size="sm" c="dimmed">
                                        Sistema de venda de ingressos seguro e confiável, com múltiplas formas de pagamento.
                                    </Text>
                                </div>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <IconUsers size={24} color="var(--mantine-color-purple-6)" />
                                <div>
                                    <Text fw={600} size="sm" mb={4}>Controle de Participantes</Text>
                                    <Text size="sm" c="dimmed">
                                        Gerencie participantes, check-ins e informações dos seus eventos em tempo real.
                                    </Text>
                                </div>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <IconCreditCard size={24} color="var(--mantine-color-orange-6)" />
                                <div>
                                    <Text fw={600} size="sm" mb={4}>Pagamentos Seguros</Text>
                                    <Text size="sm" c="dimmed">
                                        Integração com os principais gateways de pagamento para transações seguras.
                                    </Text>
                                </div>
                            </Group>
                        </Stack>
                    </div>

                    <div>
                        <Title order={3} mb="md">Precisa de ajuda?</Title>
                        <Text size="sm" c="dimmed" mb="md">
                            Nossa equipe está pronta para ajudar você! Entre em contato através dos canais abaixo:
                        </Text>
                        <Stack gap="sm">
                            <Group>
                                <Button
                                    component="a"
                                    href="https://api.whatsapp.com/send/?phone=5511955901647&text&type=phone_number&app_absent=0"
                                    target="_blank"
                                    leftSection={<IconBrandWhatsapp size={18} />}
                                    variant="light"
                                    color="green"
                                    size="md"
                                >
                                    Falar no WhatsApp
                                </Button>
                            </Group>
                            <Group>
                                <Button
                                    component="a"
                                    href="mailto:contato@evenday.app"
                                    leftSection={<IconMail size={18} />}
                                    variant="light"
                                    color="blue"
                                    size="md"
                                >
                                    Enviar Email
                                </Button>
                            </Group>
                        </Stack>
                    </div>
                </Stack>
            </div>
        </Modal>
    );
}
