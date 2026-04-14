export const otpTemplate = (otp, title = "AuthCore Verification") => {
  return `
  <div style="font-family: Arial, sans-serif; background:#f4f7f6; padding:20px;">
    <div style="max-width:500px; margin:auto; background:white; border-radius:10px; overflow:hidden;">
      
      <div style="background:#16a34a; padding:20px; text-align:center;">
        <h1 style="color:white; margin:0;">AuthCore 🔐</h1>
      </div>

      <div style="padding:20px; text-align:center;">
        <h2 style="color:#111;">${title}</h2>
        <p style="color:#555;">Use the OTP below to proceed</p>

        <div style="margin:20px 0;">
          <span style="
            font-size:28px;
            letter-spacing:5px;
            font-weight:bold;
            color:#16a34a;
          ">
            ${otp}
          </span>
        </div>

        <p style="color:#888;">This OTP expires in 5 minutes</p>
      </div>

      <div style="background:#f0fdf4; padding:10px; text-align:center; font-size:12px;">
        <p style="margin:0;">Secure Authentication by AuthCore</p>
      </div>

    </div>
  </div>
  `;
};
