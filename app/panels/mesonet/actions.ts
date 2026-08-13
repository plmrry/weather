"use server";

export async function generateRandomNumbers(
  _previousState: number[],
  _formData: FormData,
): Promise<number[]> {
  return Array.from({ length: 5 }, () => Math.random());
}
