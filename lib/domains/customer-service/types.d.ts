import { FusionComponent } from "../../types/fusion";
export type OpeningTime = {
    start: number[];
    end: number[];
};
export type OpeningTimes = {
    [date: string]: OpeningTime;
};
export type ContactDetails = {
    email: string;
    phone: string;
    whatsapp: string;
};
export type CustomerServiceContactInfo = {
    contact_details: ContactDetails;
    opening_times: OpeningTimes;
};
/**
 * Where in the app the message is shown.
 * Maps to `Message.DisplayPosition` in the Android app.
 */
export type MessageDisplayPosition = "PROMPT" | "MESSAGE_BAR" | "ORDER_CONFIRMATION" | "STOREFRONT_DIALOG" | "UNSUPPORTED";
/**
 * A single in-app message (popup, banner, order-confirmation card, etc.).
 * Maps to `Message` in the Android app.
 */
export type Message = {
    display_position: MessageDisplayPosition;
    send_correlation_id: string;
    sent_time: number;
    expiry_time: number;
    user_id: string;
    target_entity_id: string | null;
    content: {
        pml_version: string;
        component: FusionComponent;
        images: Record<string, string>;
        tracking_attributes: {
            template_variant_id: string;
            entity_ids: string[];
        };
    };
};
/**
 * Response wrapper for the /messages endpoint.
 * Maps to `MessagesWrapper` in the Android app.
 */
export type MessagesWrapper = {
    messages: Message[];
    query_interval: number | null;
};
/**
 * Day of week for a reminder.
 * Maps to `DayOfWeek` in the Android app.
 */
export type ReminderDayOfWeek = "EMPTY" | "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
/**
 * A single delivery reminder configuration.
 * Maps to `Reminder` in the Android app.
 */
export type Reminder = {
    day_of_week: ReminderDayOfWeek | null;
    time_of_day: number[] | null;
};
/**
 * Response wrapper for the GET /reminders endpoint.
 * Maps to `Reminders` in the Android app.
 */
export type RemindersWrapper = {
    reminders: Reminder[];
};
/**
 * The current tracking status of a parcel.
 */
export type ParcelCurrentStatus = {
    status: string;
    timestamp: string;
};
/**
 * A tracked parcel (external delivery via a carrier such as DHL).
 */
export type Parcel = {
    id: string;
    handler_name: string;
    active: boolean;
    current_status: ParcelCurrentStatus;
};
//# sourceMappingURL=types.d.ts.map