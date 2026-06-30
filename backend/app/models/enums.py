import enum


class OdometerUnit(str, enum.Enum):
    KM = "km"
    MILES = "miles"


class ServiceType(str, enum.Enum):
    OIL_CHANGE = "oil_change"
    TIRE = "tire"
    BRAKE = "brake"
    CHAIN = "chain"
    FILTER = "filter"
    BATTERY = "battery"
    SPARK_PLUG = "spark_plug"
    COOLANT = "coolant"
    GENERAL = "general"
    OTHER = "other"


class ExpenseCategory(str, enum.Enum):
    INSURANCE = "insurance"
    TAX = "tax"
    PARKING = "parking"
    ACCESSORIES = "accessories"
    REPAIR = "repair"
    CLEANING = "cleaning"
    FINE = "fine"
    OTHER = "other"


class ReminderType(str, enum.Enum):
    SERVICE = "service"
    INSURANCE = "insurance"
    TAX = "tax"
    CUSTOM = "custom"
