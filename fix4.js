const fs = require('fs');

const filepath = 'pages/booking.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const referral_ui = `                    {/* Coupon Input Area */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4">
                      
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Have a Coupon Code?</label>
                        <div className="flex space-x-2">
                          <input 
                            type="text" 
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="ENTER CODE" 
                            className="flex-1 p-3 border border-gray-200 rounded-lg text-sm font-bold uppercase focus:border-[var(--color-primary)] outline-none"
                            disabled={!!appliedCoupon}
                          />
                          {appliedCoupon ? (
                            <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="px-4 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-lg border border-red-100 hover:bg-red-100 transition-colors">Remove</button>
                          ) : (
                            <button type="button" onClick={applyCoupon} disabled={verifyingCoupon || !couponCode} className="px-6 py-2 bg-[var(--color-header)] text-white font-bold text-sm rounded-lg hover:bg-[var(--color-primary)] transition-colors disabled:opacity-50">
                              {verifyingCoupon ? "..." : "Apply"}
                            </button>
                          )}
                        </div>
                        {couponError && <p className="text-red-500 text-xs mt-2 font-medium">{couponError}</p>}
                        {appliedCoupon && <p className="text-green-600 text-xs mt-2 font-bold">Coupon applied successfully!</p>}
                      </div>

                      {(!user || !userData?.isReferralClaimed) && (
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Have a Referral Code?</label>
                        <div className="flex space-x-2">
                          <input 
                            type="text" 
                            value={referralInput}
                            onChange={e => setReferralInput(e.target.value.toUpperCase())}
                            placeholder="REFERRAL CODE" 
                            className="flex-1 p-3 border border-gray-200 rounded-lg text-sm font-bold uppercase focus:border-[var(--color-primary)] outline-none"
                            disabled={!!appliedReferral}
                          />
                          {appliedReferral ? (
                            <button type="button" onClick={() => { setAppliedReferral(null); setReferralInput(""); setReferralDiscountAmount(0); }} className="px-4 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-lg border border-red-100 hover:bg-red-100 transition-colors">Remove</button>
                          ) : (
                            <button type="button" onClick={applyReferralCode} disabled={verifyingReferral || !referralInput} className="px-6 py-2 bg-pink-600 text-white font-bold text-sm rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50">
                              {verifyingReferral ? "..." : "Apply"}
                            </button>
                          )}
                        </div>
                        {referralError && <p className="text-red-500 text-xs mt-2 font-medium">{referralError}</p>}
                        {appliedReferral && <p className="text-green-600 text-xs mt-2 font-bold">Referral applied! ₹50 reward unlocked on completion.</p>}
                      </div>
                      )}
                    </div>`;


let start_str = '                    {/* Coupon Input Area */}';
let end_str = '                    <div className="bg-pink-50 text-[var(--color-primary)] border border-pink-100/50 text-sm p-4 rounded-2xl flex items-start space-x-3 mb-6 font-semibold">';
let idx_start = content.indexOf(start_str);
let idx_end = content.indexOf(end_str, idx_start);

if (idx_start !== -1 && idx_end !== -1) {
    let target = content.substring(idx_start, idx_end);
    content = content.replace(target, referral_ui + '\n\n');
    fs.writeFileSync(filepath, content, 'utf8');
    console.log("REPLACED SUCCESSFULLY!");
} else {
    console.log("NOT FOUND. start:", idx_start, "end:", idx_end);
}
