export const validateInput = (schema: any, data: any) => {
  return schema.parse(data);
};
