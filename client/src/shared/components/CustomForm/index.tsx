import React from 'react';
import { t } from 'i18next';

const CustomForm = ({ handleSubmit, children }) => {
  return (
    <form onSubmit={handleSubmit}>
      {children}
      <button type="submit">{t('submit')}</button>
    </form>
  )
}

export default CustomForm