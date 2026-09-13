import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import { FormSelect } from "@/components/form/form-select";
import { FormSlider } from "@/components/form/form-slider";
import { FormStepper } from "@/components/form/form-stepper";
import { FormSubmitButton } from "@/components/form/form-submit-button";
import { FormToggleGroup } from "@/components/form/form-toggle-group";

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { FormSelect, FormSlider, FormStepper, FormToggleGroup },
  formComponents: {
    FormSubmitButton,
  },
});

export { fieldContext, formContext, useAppForm, useFieldContext, useFormContext };
