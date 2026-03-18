// Translation strings
const translations: Record<string, Record<string, string>> = {
    en: {
        // Modal - Create
        modal_title: "Create Poll",
        modal_question_label: "Question",
        modal_question_placeholder: "What do you want to ask?",
        modal_option_label: "Option",
        modal_vote_type_label: "Vote Type",
        modal_vote_type_single: "Single choice",
        modal_vote_type_multiple: "Multiple choice",
        modal_time_limit_label: "Time Limit",
        modal_time_limit_none: "No limit",
        modal_add_option: "+ Add",
        modal_remove_option: "- Remove",
        modal_submit: "Create",
        modal_settings: "Settings",
        
        // Modal - Edit
        edit_modal_title: "Edit Poll",
        edit_modal_submit: "Save",
        
        // Poll display
        poll_total_votes: "Total: {count} votes",
        poll_total_votes_one: "Total: 1 vote",
        poll_ends_at: "Ends {time}",
        poll_ended: "Ended",
        poll_by: "by",
        
        // Buttons
        button_vote: "Vote",
        button_remove_vote: "Remove vote",
        button_edit: "Edit",
        button_end: "End",
        button_reopen: "Reopen",
        button_cancel: "Cancel",
        
        // Time options
        time_5min: "5 minutes",
        time_15min: "15 minutes",
        time_30min: "30 minutes",
        time_1h: "1 hour",
        time_2h: "2 hours",
        time_24h: "24 hours",
        
        // Errors
        error_no_question: "You must enter a question.",
        error_min_options: "You must have at least 2 options.",
        error_room_not_found: "Could not find the room.",
        error_parse: "Could not parse arguments.\n\n**Usage:**\n/poll Question? Option1 Option2\n/poll Question? | Option1 | Option2\n\nOr just type /poll for the form",
    },
    sv: {
        // Modal - Create
        modal_title: "Skapa omröstning",
        modal_question_label: "Fråga",
        modal_question_placeholder: "Vad vill du fråga?",
        modal_option_label: "Alternativ",
        modal_vote_type_label: "Röstningstyp",
        modal_vote_type_single: "Enkel röst",
        modal_vote_type_multiple: "Flerval",
        modal_time_limit_label: "Tidsgräns",
        modal_time_limit_none: "Ingen gräns",
        modal_add_option: "+ Lägg till",
        modal_remove_option: "- Ta bort",
        modal_submit: "Skapa",
        modal_settings: "Inställningar",
        
        // Modal - Edit
        edit_modal_title: "Redigera omröstning",
        edit_modal_submit: "Spara",
        
        // Poll display
        poll_total_votes: "Totalt: {count} röster",
        poll_total_votes_one: "Totalt: 1 röst",
        poll_ends_at: "Stänger {time}",
        poll_ended: "Avslutad",
        poll_by: "av",
        
        // Buttons
        button_vote: "Rösta",
        button_remove_vote: "Ta bort röst",
        button_edit: "Redigera",
        button_end: "Avsluta",
        button_reopen: "Öppna igen",
        button_cancel: "Avbryt",
        
        // Time options
        time_5min: "5 minuter",
        time_15min: "15 minuter",
        time_30min: "30 minuter",
        time_1h: "1 timme",
        time_2h: "2 timmar",
        time_24h: "24 timmar",
        
        // Errors
        error_no_question: "Du måste ange en fråga.",
        error_min_options: "Du måste ha minst 2 alternativ.",
        error_room_not_found: "Kunde inte hitta rummet.",
        error_parse: "Kunde inte tolka argumenten.\n\n**Användning:**\n/poll Fråga? Alt1 Alt2\n/poll Fråga? | Alt1 | Alt2\n\nEller skriv bara /poll for formulär",
    },
};

export function t(key: string, lang: string = "en", replacements?: Record<string, string | number>): string {
    const langStrings = translations[lang] || translations.en;
    let str = langStrings[key] || translations.en[key] || key;
    
    if (replacements) {
        for (const [k, v] of Object.entries(replacements)) {
            str = str.replace(`{${k}}`, String(v));
        }
    }
    
    return str;
}

export type Language = "en" | "sv";
