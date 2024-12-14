import { Signal } from "../../types"

export const boolToSignal = (value: boolean | number): Signal => (value ? 1 : 0)
