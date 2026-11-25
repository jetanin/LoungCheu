-- LAB6 CONTROLLED EXERCISE (#64, TA-assigned): removes the one-registration-per-user/event guard on purpose.
-- Branch/CI only. Must never be deployed; removed again by the fix.
DROP INDEX "registrations_event_id_participant_id_key";
